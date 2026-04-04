"""
WebSocket consumer for real-time messaging.

Connection URL:  ws://<host>/ws/messages/?token=<jwt_access_token>

Incoming message types (JSON):
  {"type": "send_message",   "content": "...", "recipient_id": 5}   # user→support or admin→user
  {"type": "send_broadcast", "content": "..."}                       # admin only
  {"type": "mark_read",      "user_id": 5}                          # admin marks conversation read
  {"type": "mark_read"}                                              # user marks support msgs read

Outgoing message type (JSON):
  {"type": "new_message", "id": 1, "content": "...", "sender_name": "Support",
   "is_mine": false, "is_broadcast": false, "from_user_id": null,
   "from_username": null, "created_at": "..."}
"""

import json
from urllib.parse import parse_qs

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import AccessToken

from .models import Message, MESSAGE_MAX_LENGTH


# ─── auth helper ─────────────────────────────────────────────────────────────

@database_sync_to_async
def _user_from_token(raw_token: str):
    try:
        token = AccessToken(raw_token)
        return User.objects.select_related().get(pk=token['user_id'])
    except Exception:
        return None


# ─── consumer ────────────────────────────────────────────────────────────────

class MessagingConsumer(AsyncWebsocketConsumer):

    # ── lifecycle ─────────────────────────────────────────────────────────────

    async def connect(self):
        qs = parse_qs(self.scope.get('query_string', b'').decode())
        token_list = qs.get('token', [])
        self.user = await _user_from_token(token_list[0]) if token_list else None

        if not self.user or not self.user.is_authenticated:
            await self.close()
            return

        self.is_admin = self.user.is_staff or self.user.is_superuser
        self.personal_group = f'user_{self.user.id}'

        await self.channel_layer.group_add(self.personal_group, self.channel_name)
        await self.channel_layer.group_add('broadcast_group', self.channel_name)
        if self.is_admin:
            await self.channel_layer.group_add('admin_group', self.channel_name)

        await self.accept()

    async def disconnect(self, close_code):
        if not hasattr(self, 'personal_group'):
            return
        await self.channel_layer.group_discard(self.personal_group, self.channel_name)
        await self.channel_layer.group_discard('broadcast_group', self.channel_name)
        if self.is_admin:
            await self.channel_layer.group_discard('admin_group', self.channel_name)

    # ── receive from client ───────────────────────────────────────────────────

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
        except json.JSONDecodeError:
            return

        msg_type = data.get('type')
        content = data.get('content', '').strip()
        if not content and msg_type not in ('mark_read',):
            return
        if content and len(content) > MESSAGE_MAX_LENGTH:
            await self.send(text_data=json.dumps({'type': 'error', 'detail': 'Message too long.'}))
            return

        if msg_type == 'send_broadcast':
            await self._handle_broadcast(content)

        elif msg_type == 'send_message':
            recipient_id = data.get('recipient_id')
            await self._handle_direct(content, recipient_id)

        elif msg_type == 'mark_read':
            user_id = data.get('user_id')
            if self.is_admin and user_id:
                await self._mark_read_from_user(int(user_id))
            elif not self.is_admin:
                await self._mark_read_from_admin()

    # ── handlers ─────────────────────────────────────────────────────────────

    async def _handle_broadcast(self, content):
        if not self.is_admin:
            return
        msg = await self._save(self.user, None, content)
        payload = self._payload(msg, is_mine=False)
        payload['is_broadcast'] = True
        await self.channel_layer.group_send('broadcast_group', {
            'type': 'ws_deliver', 'payload': payload,
        })

    async def _handle_direct(self, content, recipient_id):
        if self.is_admin:
            # Admin → specific user
            if not recipient_id:
                return
            recipient = await self._get_user(int(recipient_id))
            if not recipient:
                return
            msg = await self._save(self.user, recipient, content)
            # Push to recipient
            await self.channel_layer.group_send(f'user_{recipient_id}', {
                'type': 'ws_deliver',
                'payload': self._payload(msg, is_mine=False),
            })
            # Echo back to admin's socket
            await self.send(text_data=json.dumps(self._payload(msg, is_mine=True)))
        else:
            # User → support
            admin = await self._get_admin()
            if not admin:
                await self.send(text_data=json.dumps({
                    'type': 'error', 'detail': 'Support is unavailable right now.'
                }))
                return
            msg = await self._save(self.user, admin, content)
            # Notify all connected admin sockets
            admin_payload = self._payload(msg, is_mine=False)
            admin_payload['from_user_id'] = self.user.id
            admin_payload['from_username'] = self.user.username
            admin_payload['from_name'] = (
                f'{self.user.first_name} {self.user.last_name}'.strip() or self.user.username
            )
            await self.channel_layer.group_send('admin_group', {
                'type': 'ws_deliver', 'payload': admin_payload,
            })
            # Echo to sender
            await self.send(text_data=json.dumps(self._payload(msg, is_mine=True)))

    # ── channel layer event ───────────────────────────────────────────────────

    async def ws_deliver(self, event):
        await self.send(text_data=json.dumps(event['payload']))

    # ── helpers ───────────────────────────────────────────────────────────────

    def _payload(self, msg: Message, *, is_mine: bool) -> dict:
        sender_is_admin = msg.sender.is_staff or msg.sender.is_superuser
        return {
            'type': 'new_message',
            'id': msg.id,
            'content': msg.content,
            'sender_id': msg.sender_id,
            'sender_name': 'Support' if sender_is_admin else (
                f'{msg.sender.first_name} {msg.sender.last_name}'.strip() or msg.sender.username
            ),
            'is_mine': is_mine,
            'is_broadcast': msg.recipient_id is None,
            'from_user_id': None,
            'from_username': None,
            'from_name': None,
            'created_at': msg.created_at.isoformat(),
        }

    @database_sync_to_async
    def _save(self, sender, recipient, content) -> Message:
        msg = Message.objects.create(sender=sender, recipient=recipient, content=content)
        # Re-fetch with related objects so _payload can read sender.is_staff etc.
        return Message.objects.select_related('sender', 'recipient').get(pk=msg.pk)

    @database_sync_to_async
    def _get_user(self, user_id) -> User | None:
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None

    @database_sync_to_async
    def _get_admin(self) -> User | None:
        return User.objects.filter(is_superuser=True).first()

    @database_sync_to_async
    def _mark_read_from_user(self, user_id):
        Message.objects.filter(
            sender_id=user_id, recipient=self.user, is_read=False
        ).update(is_read=True)

    @database_sync_to_async
    def _mark_read_from_admin(self):
        Message.objects.filter(
            sender__is_superuser=True, recipient=self.user, is_read=False
        ).update(is_read=True)
        # Also mark broadcasts as read for this user by tracking separately would need
        # a junction table; skip for now — broadcasts show as read automatically.
