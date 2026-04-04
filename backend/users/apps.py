import os

from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'users'

    def ready(self):
        from django.db.models.signals import post_migrate
        post_migrate.connect(_ensure_superuser, sender=self)


def _ensure_superuser(sender, **kwargs):
    """
    Runs once after every `migrate`. Creates or updates the platform superuser
    from ADMIN_* env vars. Safe to run repeatedly — only acts when credentials
    are provided and skips silently otherwise.
    """
    username = os.environ.get('ADMIN_USERNAME', '').strip()
    password = os.environ.get('ADMIN_PASSWORD', '').strip()
    email    = os.environ.get('ADMIN_EMAIL', '').strip()

    if not username or not password:
        return

    from django.contrib.auth.models import User

    user, created = User.objects.get_or_create(username=username)
    user.email        = email
    user.is_staff     = True
    user.is_superuser = True
    user.is_active    = True
    user.set_password(password)
    user.save()

    if created:
        print(f'[ScholarAid] Superuser "{username}" created.')
    else:
        print(f'[ScholarAid] Superuser "{username}" verified/updated.')
