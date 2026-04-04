from django.db.models import Q
from rest_framework.permissions import IsAuthenticated
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
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        messages = (
            Message.objects
            .filter(
                Q(sender=user, recipient__is_superuser=True)
                | Q(sender__is_superuser=True, recipient=user)
                | Q(recipient__isnull=True)
            )
            .select_related('sender', 'recipient')
            .order_by('created_at')
        )
        Message.objects.filter(
            sender__is_superuser=True, recipient=user, is_read=False
        ).update(is_read=True)
        return Response([_serialize(m, user.id) for m in messages])


class UserUnreadCountView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Message.objects.filter(
            sender__is_superuser=True,
            recipient=request.user,
            is_read=False,
        ).count()
        return Response({'unread': count})
