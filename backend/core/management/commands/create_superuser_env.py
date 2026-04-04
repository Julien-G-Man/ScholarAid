"""
Management command to create a superuser from environment variables.
Add to the start command on Render (before gunicorn) or run once via the Shell tab.

Required env vars:
  DJANGO_SUPERUSER_USERNAME
  DJANGO_SUPERUSER_PASSWORD
  DJANGO_SUPERUSER_EMAIL  (optional, defaults to empty)

Skips creation silently if the user already exists.
"""

import os
from django.contrib.auth.models import User
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = 'Create a superuser from environment variables if one does not already exist.'

    def handle(self, *args, **options):
        username = os.environ.get('DJANGO_SUPERUSER_USERNAME')
        password = os.environ.get('DJANGO_SUPERUSER_PASSWORD')
        email = os.environ.get('DJANGO_SUPERUSER_EMAIL', '')

        if not username or not password:
            self.stdout.write(
                self.style.WARNING(
                    'DJANGO_SUPERUSER_USERNAME or DJANGO_SUPERUSER_PASSWORD not set — skipping.'
                )
            )
            return

        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.NOTICE(f'Superuser "{username}" already exists — skipping.'))
            return

        User.objects.create_superuser(username=username, email=email, password=password)
        self.stdout.write(self.style.SUCCESS(f'Superuser "{username}" created.'))
