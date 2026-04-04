from django.core.management.base import BaseCommand, CommandError
from django.db import connection


class Command(BaseCommand):
    help = "Check database connectivity and report active backend details."

    def handle(self, *args, **options):
        settings_dict = connection.settings_dict
        engine = settings_dict.get("ENGINE", "unknown")
        db_name = settings_dict.get("NAME", "unknown")

        backend_label = "PostgreSQL" if "postgresql" in engine else "SQLite" if "sqlite3" in engine else engine

        self.stdout.write(self.style.NOTICE(f"Database backend: {backend_label}"))
        self.stdout.write(self.style.NOTICE(f"Database name: {db_name}"))

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                row = cursor.fetchone()
            if not row or row[0] != 1:
                raise CommandError("Database responded unexpectedly to SELECT 1")
        except Exception as exc:
            raise CommandError(f"Database check failed: {exc}") from exc

        self.stdout.write(self.style.SUCCESS("Database connection is healthy."))
