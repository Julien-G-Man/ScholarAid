"""
Core logic shared by management commands AND admin API views.

  run_scrape(source, limit, output_path, progress_cb)  → csv_path | raises
  run_ingest(csv_path)                                  → (inserted, skipped)

Both functions are synchronous and blocking — the API views call them in a
background thread; management commands call them directly in the foreground.
"""

import csv
import logging
from datetime import date
from pathlib import Path

from . import status as st
from .pipeline import process_pages_in_batches
from .scrapers.mastersportal import SCRAPER_REGISTRY

logger = logging.getLogger(__name__)

# CSV columns — must match core.models.Scholarships fields exactly
CSV_FIELDS = [
    'name', 'provider', 'institution', 'level',
    'description', 'eligibility', 'essay_prompt',
    'deadline', 'link', 'logo_url', 'source_url',
]


# ── Scrape task ───────────────────────────────────────────────────────────────

def run_scrape(
    source: str,
    limit: int,
    output_path: Path,
    progress_cb=None,
) -> Path:
    """
    1. Instantiate the scraper for `source`.
    2. Collect up to `limit` raw detail pages (pre-filtered for deadline).
    3. Pass pages through Claude pipeline in batches.
    4. Write cleaned, non-expired scholarships to `output_path` (CSV).
    5. Return the CSV path.

    Raises ValueError for unknown source, RuntimeError on other failures.
    """
    if source not in SCRAPER_REGISTRY:
        raise ValueError(
            f'Unknown source "{source}". '
            f'Available: {", ".join(SCRAPER_REGISTRY)}'
        )

    scraper = SCRAPER_REGISTRY[source]()
    logger.info('[scrape] Starting %s, limit=%d', source, limit)
    st.scrape_started(source)

    # Step 1 — Collect raw HTML pages
    pages = scraper.get_raw_detail_pages(limit)
    logger.info('[scrape] Collected %d raw pages', len(pages))
    st.scrape_progress(collected=len(pages), saved=0)

    # Step 2 — Claude extraction + cleaning
    def _progress(done, total):
        st.scrape_progress(collected=total, saved=done)
        if progress_cb:
            progress_cb(done, total)

    scholarships = process_pages_in_batches(pages, progress_cb=_progress)

    # Step 3 — Write CSV
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open('w', newline='', encoding='utf-8') as fh:
        writer = csv.DictWriter(fh, fieldnames=CSV_FIELDS, extrasaction='ignore')
        writer.writeheader()
        for s in scholarships:
            writer.writerow(s)

    saved = len(scholarships)
    logger.info('[scrape] Saved %d scholarships to %s', saved, output_path)
    st.scrape_done(collected=len(pages), saved=saved, csv_file=output_path.name)
    return output_path


# ── Ingest task ───────────────────────────────────────────────────────────────

def run_ingest(csv_path: Path) -> tuple[int, int]:
    """
    Read `csv_path` and insert new scholarships into the database.

    Duplicate detection: skip if a scholarship with the same (name, provider)
    already exists.  Expired deadlines are also skipped.

    Returns (inserted, skipped).
    """
    from core.models import Scholarships   # import here to avoid app-registry issues

    st.ingest_started(csv_path.name)
    inserted = 0
    skipped = 0
    today = date.today()

    with csv_path.open(newline='', encoding='utf-8') as fh:
        reader = csv.DictReader(fh)
        for row in reader:
            name = (row.get('name') or '').strip()
            provider = (row.get('provider') or '').strip()

            if not name or not provider:
                skipped += 1
                continue

            # Skip duplicates
            if Scholarships.objects.filter(name=name, provider=provider).exists():
                logger.debug('[ingest] Duplicate skipped: %s / %s', name, provider)
                skipped += 1
                continue

            # Skip expired deadlines
            deadline_str = (row.get('deadline') or '').strip()
            if deadline_str:
                try:
                    dl = date.fromisoformat(deadline_str)
                    if dl < today:
                        logger.debug('[ingest] Expired skipped: %s (deadline %s)', name, deadline_str)
                        skipped += 1
                        continue
                except ValueError:
                    deadline_str = ''   # keep record but clear invalid date

            Scholarships.objects.create(
                name=name,
                provider=provider,
                institution=row.get('institution') or None,
                level=row.get('level') or None,
                description=row.get('description', ''),
                eligibility=row.get('eligibility') or None,
                essay_prompt=row.get('essay_prompt') or None,
                deadline=deadline_str or None,
                link=row.get('link') or None,
                logo_url=row.get('logo_url') or None,
            )
            inserted += 1

    logger.info('[ingest] Done — inserted=%d, skipped=%d', inserted, skipped)
    st.ingest_done(inserted=inserted, skipped=skipped)
    return inserted, skipped
