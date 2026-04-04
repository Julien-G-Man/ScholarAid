"""
Management command: scrape scholarship data from external portals.

Usage:
  python manage.py scrape_scholarships
  python manage.py scrape_scholarships --source mastersportal --limit 500
  python manage.py scrape_scholarships --source scholarshipportal --limit 200 --output /tmp/out.csv
  python manage.py scrape_scholarships --source opportunitiesforafricans --limit 200

Options:
  --source   Site to scrape (default: mastersportal)
             Choices: mastersportal, scholarshipportal, opportunitiesforafricans
  --limit    Max non-expired scholarships to collect (default: 500)
  --output   Path for the output CSV (default: backend/data/scholarships_<source>_<date>.csv)
"""

from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand

from scraper.scrapers.mastersportal import SCRAPER_REGISTRY
from scraper.tasks import run_scrape
from scraper.status import data_dir


class Command(BaseCommand):
    help = 'Scrape scholarship listings from external portals and save to CSV.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--source',
            default='mastersportal',
            choices=list(SCRAPER_REGISTRY.keys()),
            help='Portal to scrape (default: mastersportal)',
        )
        parser.add_argument(
            '--limit',
            type=int,
            default=500,
            help='Maximum number of non-expired scholarships to collect (default: 500)',
        )
        parser.add_argument(
            '--output',
            default=None,
            help='Output CSV path (default: backend/data/scholarships_<source>_<YYYYMMDD>.csv)',
        )

    def handle(self, *args, **options):
        source: str = options['source']
        limit: int = options['limit']
        output: str | None = options['output']

        if output:
            csv_path = Path(output)
        else:
            stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            csv_path = data_dir() / f'scholarships_{source}_{stamp}.csv'

        self.stdout.write(
            self.style.MIGRATE_HEADING(
                f'\n ScholarAid Scraper\n'
                f'   Source : {source}\n'
                f'   Limit  : {limit}\n'
                f'   Output : {csv_path}\n'
            )
        )

        def collect_progress(done, total):
            self.stdout.write(
                f'  [Collect] Found {done}/{total} pages...', ending='\r'
            )
            self.stdout.flush()

        def progress(done, total):
            self.stdout.write(
                f'  [Extract] Processed {done}/{total} pages...', ending='\r'
            )
            self.stdout.flush()

        try:
            result_path = run_scrape(
                source=source,
                limit=limit,
                output_path=csv_path,
                progress_cb=progress,
                collect_cb=collect_progress,
            )
            self.stdout.write('')   # newline after \r progress
            self.stdout.write(
                self.style.SUCCESS(f'\n Done. CSV saved to: {result_path}\n')
            )
        except ValueError as exc:
            self.stderr.write(self.style.ERROR(str(exc)))
        except Exception as exc:
            self.stderr.write(self.style.ERROR(f'Scrape failed: {exc}'))
            raise
