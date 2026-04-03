from django.contrib import admin
from .models import UserProfile


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'institution', 'field_of_study', 'country', 'created_at')
    search_fields = ('user__username', 'user__email', 'institution')
    ordering = ('-created_at',)
