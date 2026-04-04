from django.core.validators import MaxLengthValidator
from django.db import models
from django.contrib.auth.models import User

# Hard cap: prevents huge payloads being stored even if the consumer layer misses them
MESSAGE_MAX_LENGTH = 4000


class Message(models.Model):
    sender = models.ForeignKey(
        User, on_delete=models.CASCADE, related_name='sent_messages'
    )
    # null recipient = broadcast to all users
    recipient = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='received_messages'
    )
    content = models.TextField(validators=[MaxLengthValidator(MESSAGE_MAX_LENGTH)])
    is_read = models.BooleanField(default=False, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['recipient', 'is_read'], name='msg_recipient_read_idx'),
            models.Index(fields=['sender', 'recipient'], name='msg_sender_recipient_idx'),
        ]

    def __str__(self):
        if self.recipient_id:
            return f'{self.sender.username} → {self.recipient.username}: {self.content[:50]}'
        return f'[BROADCAST] {self.sender.username}: {self.content[:50]}'
