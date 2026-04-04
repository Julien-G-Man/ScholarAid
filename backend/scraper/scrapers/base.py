"""
Base scraper class.

Each site-specific scraper extends this and only needs to define:
  - SOURCE_NAME        unique string identifier (used in CSV)
  - LISTING_URL        root listing URL
  - listing_page_url() returns paginated URL given an offset
  - extract_links()    returns list of detail-page URLs from listing HTML

The actual field extraction is handled by the Claude pipeline (pipeline.py),
so scrapers never contain fragile CSS selectors for content - only for navigation.
"""

import logging
import time
from abc import ABC, abstractmethod
from urllib.parse import urlsplit

import requests
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

_SESSION = requests.Session()
_SESSION.headers.update(
    {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
            '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        ),
        'Accept': (
            'text/html,application/xhtml+xml,application/xml;q=0.9,'
            'image/avif,image/webp,*/*;q=0.8'
        ),
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1',
    }
)


class BaseScraper(ABC):
    SOURCE_NAME: str = ''
    LISTING_URL: str = ''
    PAGE_SIZE: int = 20          # scholarships per listing page
    RATE_LIMIT: float = 1.5      # seconds between HTTP requests
    USE_QUICK_DEADLINE_FILTER: bool = True

    def request_headers(self, url: str) -> dict[str, str]:
        """
        Build per-request headers. Default behavior sets a same-site referer
        to look like normal navigation from the listing site.
        """
        parsed = urlsplit(url)
        if parsed.scheme and parsed.netloc:
            return {'Referer': f'{parsed.scheme}://{parsed.netloc}/'}
        return {}

    def fetch(self, url: str, timeout: int = 20) -> str | None:
        """Fetch a URL and return HTML text, or None on error."""
        try:
            time.sleep(self.RATE_LIMIT)
            resp = _SESSION.get(url, timeout=timeout, headers=self.request_headers(url))
            resp.raise_for_status()
            return resp.text
        except requests.RequestException as exc:
            logger.warning('Fetch failed for %s: %s', url, exc)
            return None

    def soup(self, html: str) -> BeautifulSoup:
        return BeautifulSoup(html, 'lxml')

    @abstractmethod
    def listing_page_url(self, offset: int) -> str:
        """Return the listing URL for the given pagination offset."""

    @abstractmethod
    def extract_links(self, html: str) -> list[str]:
        """
        Return a list of absolute detail-page URLs from a listing page's HTML.
        Return an empty list if none found (signals end of pagination).
        """

    def get_raw_detail_pages(self, limit: int, progress_cb=None) -> list[dict]:
        """
        Paginate through listing pages, follow each detail link, and return a
        list of { 'url': str, 'html': str } dicts - up to `limit` entries.

        The caller (tasks.py) is responsible for passing these to the Claude
        pipeline and filtering by deadline.
        """
        from scraper.pipeline import quick_deadline_from_html

        collected: list[dict] = []
        offset = 0
        seen_urls: set[str] = set()

        while len(collected) < limit:
            listing_url = self.listing_page_url(offset)
            logger.info('[%s] Fetching listing: %s', self.SOURCE_NAME, listing_url)
            if progress_cb:
                progress_cb(len(collected), limit, listing_url)

            html = self.fetch(listing_url)
            if not html:
                logger.warning('[%s] Empty response at offset %d, stopping.', self.SOURCE_NAME, offset)
                break

            links = self.extract_links(html)
            if not links:
                logger.info('[%s] No links found at offset %d, end of pages.', self.SOURCE_NAME, offset)
                break

            for link in links:
                if len(collected) >= limit:
                    break
                if link in seen_urls:
                    continue
                seen_urls.add(link)

                detail_html = self.fetch(link)
                if not detail_html:
                    continue

                if (
                    self.USE_QUICK_DEADLINE_FILTER
                    and quick_deadline_from_html(detail_html) == 'expired'
                ):
                    logger.debug('[%s] Skipping expired: %s', self.SOURCE_NAME, link)
                    continue

                collected.append({'url': link, 'html': detail_html})
                logger.info(
                    '[%s] Collected %d / %d - %s',
                    self.SOURCE_NAME,
                    len(collected),
                    limit,
                    link,
                )
                if progress_cb:
                    progress_cb(len(collected), limit, link)

            offset += self.PAGE_SIZE

        return collected
