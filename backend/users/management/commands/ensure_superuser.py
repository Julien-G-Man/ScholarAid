"""
Management command: ensure_superuser

Creates (or updates) the platform superuser from environment variables.
Run once on deploy, or add it to your startup script.

Required env vars:
    ADMIN_USERNAME  — login username
    ADMIN_EMAIL     — admin email address
    ADMIN_PASSWORD  — admin password

Usage:
    python manage.py ensure_superuser
"""

import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = 'Create or update the platform superuser from ADMIN_* env vars.'

    def handle(self, *args, **options):
        username = os.environ.get('ADMIN_USERNAME', '').strip()
        email    = os.environ.get('ADMIN_EMAIL', '').strip()
        password = os.environ.get('ADMIN_PASSWORD', '').strip()

        if not username:
            raise CommandError('ADMIN_USERNAME env var is not set.')
        if not password:
            raise CommandError('ADMIN_PASSWORD env var is not set.')

        user, created = User.objects.get_or_create(username=username)
        user.email        = email
        user.is_staff     = True
        user.is_superuser = True
        user.is_active    = True
        user.set_password(password)
        user.save()

        if created:
            self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" updated.'))
