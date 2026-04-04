"""
Management command: ingest scholarships from a CSV file into the database.

Usage:
  # Ingest the most recently scraped CSV (auto-detected)
  python manage.py ingest_scholarships

  # Ingest a specific file
  python manage.py ingest_scholarships --input backend/data/scholarships_mastersportal_20260404.csv

  # Preview what would be inserted without actually writing
  python manage.py ingest_scholarships --dry-run

Options:
  --input    Path to CSV file (default: most recent CSV in backend/data/)
  --dry-run  Show counts without writing to the database
"""

from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from scraper.status import latest_csv_path
from scraper.tasks import run_ingest, CSV_FIELDS


class Command(BaseCommand):
    help = 'Ingest scholarships from a CSV into the database (skips duplicates and expired).'

    def add_arguments(self, parser):
        parser.add_argument(
            '--input',
            default=None,
            help='CSV file path (default: most recent CSV in backend/data/)',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            default=False,
            help='Preview counts without writing to the database',
        )

    def handle(self, *args, **options):
        input_path: str | None = options['input']
        dry_run: bool = options['dry_run']

        if input_path:
            csv_path = Path(input_path)
        else:
            csv_path = latest_csv_path()

        if not csv_path or not csv_path.exists():
            raise CommandError(
                'No CSV file found. Run scrape_scholarships first, or '
                'pass --input <path>.'
            )

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f'\n ScholarAid Ingestion\n'
                f'   File    : {csv_path}\n'
                f'   Dry run : {dry_run}\n'
            )
        )
        self.stdout.write(f'  CSV columns expected: {", ".join(CSV_FIELDS)}\n')

        if dry_run:
            # Preview: count rows, show sample
            import csv
            total = 0
            with csv_path.open(newline='', encoding='utf-8') as fh:
                reader = csv.DictReader(fh)
                for row in reader:
                    total += 1
                    if total <= 3:
                        self.stdout.write(f'  Sample row: {row.get("name")} / {row.get("provider")}')
            self.stdout.write(
                self.style.WARNING(f'\n [dry-run] {total} rows in CSV — no DB changes made.\n')
            )
            return

        try:
            inserted, skipped = run_ingest(csv_path)
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n Done.\n'
                    f'   Inserted : {inserted}\n'
                    f'   Skipped  : {skipped} (duplicates or expired)\n'
                )
            )
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f'Ingestion failed: {exc}'))
            raise
