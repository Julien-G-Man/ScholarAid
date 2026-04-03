from django.contrib import admin
from .models import Scholarships, NewsletterSubscription, ContactMessage


@admin.register(Scholarships)
class ScholarshipsAdmin(admin.ModelAdmin):
    list_display = ('name', 'provider', 'level', 'deadline', 'created_at')
    list_filter = ('level', 'provider', 'deadline')
    search_fields = ('name', 'description', 'provider', 'institution')
    ordering = ('-created_at',)


@admin.register(NewsletterSubscription)
class NewsletterSubscriptionAdmin(admin.ModelAdmin):
    list_display = ('email', 'created_at')
    ordering = ('-created_at',)


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'is_read', 'created_at')
    list_filter = ('is_read',)
    search_fields = ('name', 'email', 'subject', 'message')
    ordering = ('-created_at',)
