from django.db import models
from django.contrib.auth.models import User
from core.models import Scholarships


class ApplicationGuide(models.Model):
    """Pre-built guidance for scholarship types and categories."""
    CATEGORIES = [
        ('overview', 'Overview'),
        ('requirements', 'Requirements Analysis'),
        ('essay_tips', 'Essay Writing Tips'),
        ('common_mistakes', 'Common Mistakes'),
        ('standing_out', 'How to Stand Out'),
    ]

    scholarship = models.ForeignKey(Scholarships, on_delete=models.CASCADE, related_name='ai_guides')
    category = models.CharField(max_length=50, choices=CATEGORIES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('scholarship', 'category')

    def __str__(self):
        return f"{self.scholarship.name} — {self.get_category_display()}"


class AIReviewSession(models.Model):
    """Tracks an AI review session for a user working on a scholarship."""
    STATUS_CHOICES = [
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('archived', 'Archived'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ai_sessions')
    scholarship = models.ForeignKey(Scholarships, on_delete=models.CASCADE, related_name='ai_sessions')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='in_progress', db_index=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True, db_index=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['user', 'status'], name='ai_session_user_status_idx'),
        ]

    def __str__(self):
        return f"{self.user.username} — {self.scholarship.name}"


class EssayFeedback(models.Model):
    """Stores detailed feedback on a submitted essay."""
    session = models.OneToOneField(AIReviewSession, on_delete=models.CASCADE, related_name='feedback')
    essay_text = models.TextField()
    essay_file_name = models.CharField(max_length=255, blank=True)

    overall_score = models.IntegerField(default=0)
    structure_feedback = models.TextField(blank=True)
    clarity_feedback = models.TextField(blank=True)
    relevance_feedback = models.TextField(blank=True)
    persuasiveness_feedback = models.TextField(blank=True)
    grammar_feedback = models.TextField(blank=True)

    strengths = models.TextField(blank=True)
    improvements = models.TextField(blank=True)
    next_steps = models.TextField(blank=True)

    reviewed_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-reviewed_at']

    def __str__(self):
        return f"Feedback for {self.session.user.username} — {self.session.scholarship.name}"


class ChatMessage(models.Model):
    """Tracks Q&A chat between user and AI guide."""
    session = models.ForeignKey(AIReviewSession, on_delete=models.CASCADE, related_name='chat_messages')
    role = models.CharField(max_length=10, choices=[('user', 'User'), ('ai', 'AI')], db_index=True)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.role.upper()} — {self.session}"
