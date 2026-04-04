"""
Simple file-based status tracker for long-running scrape / ingest jobs.

Status is stored as JSON at backend/data/scrape_status.json.
Both management commands and API views read/write through this module.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path

from django.conf import settings

_STATUS_FILE = Path(settings.BASE_DIR) / 'data' / 'scrape_status.json'

_DEFAULT: dict = {
    'scrape': {
        'state': 'idle',          # idle | running | done | error
        'started_at': None,
        'finished_at': None,
        'source': None,
        'collected': 0,
        'saved': 0,
        'csv_file': None,         # relative path inside data/
        'error': None,
    },
    'ingest': {
        'state': 'idle',
        'started_at': None,
        'finished_at': None,
        'csv_file': None,
        'inserted': 0,
        'skipped': 0,
        'error': None,
    },
}


def _ensure_dir():
    _STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)


def read() -> dict:
    _ensure_dir()
    if _STATUS_FILE.exists():
        try:
            return json.loads(_STATUS_FILE.read_text())
        except (json.JSONDecodeError, OSError):
            pass
    return json.loads(json.dumps(_DEFAULT))   # deep copy of default


def _write(data: dict):
    _ensure_dir()
    _STATUS_FILE.write_text(json.dumps(data, indent=2, default=str))


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


# ── Scrape job helpers ────────────────────────────────────────────────────────

def scrape_started(source: str):
    d = read()
    d['scrape'] = {**_DEFAULT['scrape'], 'state': 'running', 'started_at': _now(), 'source': source}
    _write(d)


def scrape_progress(collected: int, saved: int):
    d = read()
    d['scrape']['collected'] = collected
    d['scrape']['saved'] = saved
    _write(d)


def scrape_done(collected: int, saved: int, csv_file: str):
    d = read()
    d['scrape'].update({
        'state': 'done',
        'finished_at': _now(),
        'collected': collected,
        'saved': saved,
        'csv_file': csv_file,
    })
    _write(d)


def scrape_error(msg: str):
    d = read()
    d['scrape'].update({'state': 'error', 'finished_at': _now(), 'error': msg})
    _write(d)


# ── Ingest job helpers ────────────────────────────────────────────────────────

def ingest_started(csv_file: str):
    d = read()
    d['ingest'] = {**_DEFAULT['ingest'], 'state': 'running', 'started_at': _now(), 'csv_file': csv_file}
    _write(d)


def ingest_done(inserted: int, skipped: int):
    d = read()
    d['ingest'].update({
        'state': 'done',
        'finished_at': _now(),
        'inserted': inserted,
        'skipped': skipped,
    })
    _write(d)


def ingest_error(msg: str):
    d = read()
    d['ingest'].update({'state': 'error', 'finished_at': _now(), 'error': msg})
    _write(d)


# ── CSV file helpers ──────────────────────────────────────────────────────────

def data_dir() -> Path:
    p = Path(settings.BASE_DIR) / 'data'
    p.mkdir(parents=True, exist_ok=True)
    return p


def latest_csv_path() -> Path | None:
    """Return the Path of the most recent scraped CSV, or None."""
    status = read()
    rel = status.get('scrape', {}).get('csv_file')
    if rel:
        p = data_dir() / os.path.basename(rel)
        if p.exists():
            return p
    # Fallback: find newest CSV in data dir
    csvs = sorted(data_dir().glob('scholarships_*.csv'), key=lambda f: f.stat().st_mtime)
    return csvs[-1] if csvs else None
