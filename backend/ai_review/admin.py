from django.contrib import admin
from .models import ApplicationGuide, AIReviewSession, EssayFeedback, ChatMessage


@admin.register(ApplicationGuide)
class ApplicationGuideAdmin(admin.ModelAdmin):
    list_display = ['scholarship', 'category', 'created_at']
    list_filter = ['category', 'created_at']
    search_fields = ['scholarship__name', 'content']
    ordering = ['-created_at']


@admin.register(AIReviewSession)
class AIReviewSessionAdmin(admin.ModelAdmin):
    list_display = ['user', 'scholarship', 'status', 'updated_at']
    list_filter = ['status', 'created_at']
    readonly_fields = ['created_at', 'updated_at']
    search_fields = ['user__username', 'scholarship__name']
    ordering = ['-updated_at']


@admin.register(EssayFeedback)
class EssayFeedbackAdmin(admin.ModelAdmin):
    list_display = ['session', 'overall_score', 'reviewed_at']
    list_filter = ['overall_score', 'reviewed_at']
    readonly_fields = ['reviewed_at']
    search_fields = ['session__user__username', 'session__scholarship__name']
    ordering = ['-reviewed_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['session', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    readonly_fields = ['created_at']
    search_fields = ['session__user__username', 'content']
    ordering = ['session', 'created_at']
