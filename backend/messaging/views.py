from django.contrib.auth.models import User
from django.db.models import Q
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Message


def _serialize(msg: Message, viewer_id: int) -> dict:
    sender_is_admin = msg.sender.is_staff or msg.sender.is_superuser
    return {
        'id': msg.id,
        'content': msg.content,
        'sender_id': msg.sender_id,
        'sender_name': 'Support' if sender_is_admin else (
            f'{msg.sender.first_name} {msg.sender.last_name}'.strip() or msg.sender.username
        ),
        'is_mine': msg.sender_id == viewer_id,
        'is_broadcast': msg.recipient_id is None,
        'is_read': msg.is_read,
        'created_at': msg.created_at.isoformat(),
    }


class UserThreadView(APIView):
    """GET /api/v1/messages/

    Returns the authenticated user's conversation with support (admin).
    Also marks all incoming admin→user messages as read.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        # Personal messages between this user and any admin, plus broadcasts
        messages = (
            Message.objects
            .filter(
                Q(sender=user, recipient__is_superuser=True) |
                Q(sender__is_superuser=True, recipient=user) |
                Q(recipient__isnull=True)   # broadcasts
            )
            .select_related('sender', 'recipient')
            .order_by('created_at')
        )
        # Mark incoming as read
        Message.objects.filter(
            sender__is_superuser=True, recipient=user, is_read=False
        ).update(is_read=True)
        return Response([_serialize(m, user.id) for m in messages])


class UserUnreadCountView(APIView):
    """GET /api/v1/messages/unread-count/

    Returns count of unread messages from support to the current user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(
            sender__is_superuser=True,
            recipient=request.user,
            is_read=False,
        ).count()
        return Response({'unread': count})


# ─── Admin endpoints ──────────────────────────────────────────────────────────

class AdminInboxView(APIView):
    """GET /api/v1/admin/messages/

    Returns all user conversation threads (summary) for the admin.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        admin = request.user
        # All personal (non-broadcast) messages involving admin
        messages = (
            Message.objects
            .filter(
                Q(sender=admin) | Q(recipient=admin),
                recipient__isnull=False,
            )
            .select_related('sender', 'recipient')
            .order_by('created_at')
        )

        conversations: dict = {}
        for msg in messages:
            other = msg.recipient if msg.sender_id == admin.id else msg.sender
            if other.id not in conversations:
                conversations[other.id] = {
                    'user_id': other.id,
                    'username': other.username,
                    'first_name': other.first_name,
                    'last_name': other.last_name,
                    'last_message': None,
                    'unread': 0,
                }
            conversations[other.id]['last_message'] = {
                'content': msg.content,
                'created_at': msg.created_at.isoformat(),
                'is_mine': msg.sender_id == admin.id,
            }
            if not msg.is_read and msg.sender_id != admin.id:
                conversations[other.id]['unread'] += 1

        # Sort by last message time desc
        result = sorted(
            conversations.values(),
            key=lambda c: c['last_message']['created_at'] if c['last_message'] else '',
            reverse=True,
        )
        return Response(result)


class AdminUnreadCountView(APIView):
    """GET /api/v1/admin/messages/unread-count/

    Total unread messages from users to admin.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        count = Message.objects.filter(
            recipient=request.user,
            is_read=False,
            sender__is_superuser=False,
        ).count()
        return Response({'unread': count})


class AdminDeleteMessageView(APIView):
    """DELETE /api/v1/admin/messages/delete/{message_id}/

    Permanently delete a single message. Admin only.
    """
    permission_classes = [IsAdminUser]

    def delete(self, request, message_id):
        try:
            msg = Message.objects.get(pk=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=404)
        msg.delete()
        return Response(status=204)


class AdminConversationView(APIView):
    """GET /api/v1/admin/messages/{user_id}/

    Full message thread between admin and a specific user.
    Also marks that user's messages to admin as read.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, user_id):
        admin = request.user
        try:
            other = User.objects.get(pk=user_id, is_superuser=False)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        messages = (
            Message.objects
            .filter(
                Q(sender=admin, recipient=other) |
                Q(sender=other, recipient=admin)
            )
            .select_related('sender', 'recipient')
            .order_by('created_at')
        )
        # Mark incoming as read
        Message.objects.filter(
            sender=other, recipient=admin, is_read=False
        ).update(is_read=True)

        return Response([_serialize(m, admin.id) for m in messages])
