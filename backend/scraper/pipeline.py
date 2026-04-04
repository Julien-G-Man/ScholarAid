"""
Claude-powered data pipeline for the scholarship scraper.

Responsibilities:
  1. quick_deadline_from_html() — fast heuristic deadline check (no Claude call)
     to pre-filter obviously expired pages before burning API quota.

  2. extract_scholarships_from_batch() — sends a batch of detail-page HTMLs to
     Claude (claude-opus-4-6 + adaptive thinking) and returns a list of cleaned
     scholarship dicts that match the core.models.Scholarships field schema.

Claude handles all field extraction, normalisation (date format, text cleanup),
and validation. This means the scraper never contains fragile per-site selectors.
"""

import json
import logging
import re
from html import unescape
from datetime import date
from html.parser import HTMLParser
from urllib.parse import urlsplit

from django.conf import settings
try:
    import anthropic
except Exception:  # pragma: no cover - optional dependency/runtime
    anthropic = None

logger = logging.getLogger(__name__)

# ── Constants ─────────────────────────────────────────────────────────────────

BATCH_SIZE = 5           # detail pages per Claude call
MAX_HTML_CHARS = 8_000   # chars of HTML to send per page (trimmed for cost)

# ── HTML → plain-text stripper (stdlib, no extra deps) ────────────────────────

class _TextExtractor(HTMLParser):
    _SKIP = {'script', 'style', 'noscript', 'head', 'nav', 'footer', 'meta', 'link'}

    def __init__(self):
        super().__init__()
        self._chunks: list[str] = []
        self._depth = 0

    def handle_starttag(self, tag, attrs):
        if tag in self._SKIP:
            self._depth += 1

    def handle_endtag(self, tag):
        if tag in self._SKIP and self._depth:
            self._depth -= 1

    def handle_data(self, data):
        if not self._depth:
            t = data.strip()
            if t:
                self._chunks.append(t)

    def text(self) -> str:
        return ' '.join(self._chunks)


def _html_to_text(html: str) -> str:
    p = _TextExtractor()
    p.feed(html[:60_000])   # cap before parsing to avoid huge inputs
    return p.text()


# ── Quick deadline heuristic ──────────────────────────────────────────────────

_DATE_PATTERNS = [
    # ISO  2024-12-31
    re.compile(r'\b(20\d{2})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])\b'),
    # European  31 December 2024 / 31 Dec 2024
    re.compile(
        r'\b(0?[1-9]|[12]\d|3[01])\s+'
        r'(January|February|March|April|May|June|July|August|September|'
        r'October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'
        r'\s+(20\d{2})\b',
        re.IGNORECASE,
    ),
    # American  December 31, 2024
    re.compile(
        r'\b(January|February|March|April|May|June|July|August|September|'
        r'October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Oct|Nov|Dec)'
        r'\s+(0?[1-9]|[12]\d|3[01]),?\s+(20\d{2})\b',
        re.IGNORECASE,
    ),
]

_MONTH_MAP = {
    'january': 1, 'jan': 1, 'february': 2, 'feb': 2,
    'march': 3,   'mar': 3, 'april': 4,    'apr': 4,
    'may': 5,     'june': 6, 'jun': 6,
    'july': 7,    'jul': 7, 'august': 8,   'aug': 8,
    'september': 9, 'sep': 9, 'october': 10, 'oct': 10,
    'november': 11, 'nov': 11, 'december': 12, 'dec': 12,
}


def _parse_date_match(m: re.Match) -> date | None:
    groups = [g for g in m.groups() if g]
    try:
        # ISO pattern: year, month, day
        if re.match(r'20\d{2}', groups[0]):
            return date(int(groups[0]), int(groups[1]), int(groups[2]))
        # European: day, month_name, year
        if re.match(r'\d{1,2}', groups[0]) and not groups[0].isdigit() is False:
            if groups[1].lower() in _MONTH_MAP:
                return date(int(groups[2]), _MONTH_MAP[groups[1].lower()], int(groups[0]))
        # American: month_name, day, year
        if groups[0].lower() in _MONTH_MAP:
            return date(int(groups[2]), _MONTH_MAP[groups[0].lower()], int(groups[1]))
    except (ValueError, IndexError):
        pass
    return None


def quick_deadline_from_html(html: str) -> str:
    """
    Heuristic scan of raw HTML for a deadline date.

    Returns:
      'expired'  — found a date that has already passed
      'active'   — found a date that is still in the future
      'unknown'  — could not find any date (let Claude decide)
    """
    today = date.today()
    text = _html_to_text(html[:20_000])

    for pattern in _DATE_PATTERNS:
        for m in pattern.finditer(text):
            d = _parse_date_match(m)
            if d:
                return 'expired' if d < today else 'active'

    return 'unknown'


# ── Claude batch extraction ───────────────────────────────────────────────────

_BATCH_PROMPT_INTRO = """\
You are a scholarship data extraction specialist.

Below are {n} scholarship detail pages (plain text, numbered 1–{n}).
For EACH page return a JSON object with these exact keys (null if not found):

  name        – full scholarship name (string or null)
  provider    – organisation offering it, e.g. "DAAD" (string or null)
  institution – target university/institution or null
  level       – academic level: "Undergraduate", "Postgraduate", "PhD", "All", or null
  description – concise 2–4 sentence summary (string or null)
  eligibility – eligibility criteria as a readable paragraph or null
  essay_prompt– essay / personal-statement prompt if mentioned, else null
  deadline    – application deadline in YYYY-MM-DD format or null
  link        – direct application/info URL or null
  logo_url    – provider logo image URL or null
  source_url  – the URL I gave you for this page (copy it back exactly)
  expired     – true if deadline has already passed today ({today}), else false

Return a JSON ARRAY of {n} objects in the same order as the input.
If a field is unclear, return null instead of guessing.
No markdown, no prose — just the raw JSON array.

---
"""

_ITEM_TEMPLATE = 'PAGE {i} (URL: {url})\n{text}\n'
_JSON_ARRAY_RE = re.compile(r'\[[\s\S]*\]')


def _fallback_extract_record(page: dict) -> dict:
    """
    Best-effort extraction that does not require Anthropic.
    Keeps data flowing by using URL/title/plain-text heuristics.
    """
    url = (page.get('url') or '').strip()
    html = page.get('html') or ''

    title = ''
    m = re.search(r'<title[^>]*>(.*?)</title>', html, flags=re.IGNORECASE | re.DOTALL)
    if m:
        title = re.sub(r'\s+', ' ', m.group(1)).strip()

    parsed = urlsplit(url)
    provider = parsed.netloc.lower().replace('www.', '') if parsed.netloc else ''
    text = _html_to_text(html)
    desc = unescape(re.sub(r'\s+', ' ', text).strip())
    if len(desc) > 600:
        desc = desc[:600].rsplit(' ', 1)[0].strip() + '...'

    name = unescape(title or url.rstrip('/').split('/')[-1].replace('-', ' ').strip())
    name = re.sub(
        r'\s*[-|]\s*opportunities\s+for\s+africans\s*$',
        '',
        name,
        flags=re.IGNORECASE,
    ).strip()

    return {
        'name': name,
        'provider': provider,
        'institution': '',
        'level': '',
        'description': desc,
        'eligibility': '',
        'essay_prompt': '',
        'deadline': '',
        'link': url,
        'logo_url': '',
        'source_url': url,
    }


def _fallback_extract_batch(pages: list[dict], reason: str) -> list[dict]:
    logger.warning('Claude extraction unavailable, using fallback extraction: %s', reason)
    return [_fallback_extract_record(page) for page in pages if isinstance(page, dict)]


def extract_scholarships_from_batch(
    pages: list[dict],   # [{'url': str, 'html': str}, ...]
) -> list[dict]:
    """
    Send a batch of detail pages to Claude and return cleaned scholarship dicts.

    Each returned dict has keys matching core.models.Scholarships fields plus
    'source_url'. Filtering is intentionally lenient so partially extracted
    records are still available in CSV for human review.
    """
    if not pages:
        return []

    api_key = (getattr(settings, 'ANTHROPIC_API_KEY', '') or '').strip()
    if anthropic is None:
        return _fallback_extract_batch(pages, 'anthropic package not installed')
    if not api_key:
        return _fallback_extract_batch(pages, 'ANTHROPIC_API_KEY is missing')

    client = anthropic.Anthropic(api_key=api_key)
    today_str = date.today().isoformat()
    n = len(pages)

    prompt = _BATCH_PROMPT_INTRO.format(n=n, today=today_str)
    for i, page in enumerate(pages, start=1):
        text = _html_to_text(page['html'])[:MAX_HTML_CHARS]
        prompt += _ITEM_TEMPLATE.format(i=i, url=page['url'], text=text)

    try:
        message = client.messages.create(
            model='claude-opus-4-6',
            max_tokens=4096,
            thinking={'type': 'adaptive'},
            messages=[{'role': 'user', 'content': prompt}],
        )
    except Exception as exc:
        return _fallback_extract_batch(pages, f'Claude API error: {exc}')

    # Find text block (thinking blocks may precede it)
    raw = ''
    for block in message.content:
        if block.type == 'text':
            raw = block.text
            break

    match = _JSON_ARRAY_RE.search(raw)
    if not match:
        return _fallback_extract_batch(pages, 'Claude response was not valid JSON array')

    try:
        items: list[dict] = json.loads(match.group())
    except json.JSONDecodeError as exc:
        return _fallback_extract_batch(pages, f'JSON parse error: {exc}')

    # Filter and validate (lenient mode: keep partial rows for review)
    results: list[dict] = []
    for idx, item in enumerate(items):
        if not isinstance(item, dict):
            continue

        name = (item.get('name') or '').strip()
        provider = (item.get('provider') or '').strip()
        description = (item.get('description') or '').strip()
        source_url = (item.get('source_url') or '').strip()
        link = (item.get('link') or '').strip()

        # Drop only totally unusable rows (no useful identifying content).
        if not name and not description and not source_url and not link:
            logger.debug('Filtered empty record from model output')
            continue

        page_url = pages[idx].get('url', '') if idx < len(pages) else ''

        cleaned = {
            'name': name,
            'provider': provider,
            'institution': (item.get('institution') or '').strip(),
            'level': (item.get('level') or '').strip(),
            'description': description,
            'eligibility': (item.get('eligibility') or '').strip(),
            'essay_prompt': (item.get('essay_prompt') or '').strip(),
            'deadline': (item.get('deadline') or '').strip(),
            'link': link,
            'logo_url': (item.get('logo_url') or '').strip(),
            'source_url': source_url or page_url,
        }
        results.append(cleaned)

    return results


def process_pages_in_batches(
    pages: list[dict],
    batch_size: int = BATCH_SIZE,
    progress_cb=None,
) -> list[dict]:
    """
    Split pages into batches, run each through Claude, collect results.

    progress_cb(completed, total) is called after each batch if provided.
    """
    results: list[dict] = []
    total = len(pages)

    for start in range(0, total, batch_size):
        batch = pages[start:start + batch_size]
        cleaned = extract_scholarships_from_batch(batch)
        results.extend(cleaned)
        if progress_cb:
            progress_cb(min(start + batch_size, total), total)

    return results

