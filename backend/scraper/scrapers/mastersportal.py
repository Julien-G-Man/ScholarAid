"""
Site scrapers and source registry for scholarship collection.

Each scraper only handles listing pagination and detail-page URL discovery.
Field extraction is delegated to the AI pipeline.
"""

from urllib.parse import urljoin, urlsplit, urlunsplit

from .base import BaseScraper


class MastersPortalScraper(BaseScraper):
    SOURCE_NAME = 'mastersportal'
    LISTING_URL = 'https://www.mastersportal.eu/scholarships/'
    PAGE_SIZE = 20

    def listing_page_url(self, offset: int) -> str:
        return f'{self.LISTING_URL}?Limit={self.PAGE_SIZE}&Start={offset}'

    def extract_links(self, html: str) -> list[str]:
        soup = self.soup(html)
        links: list[str] = []

        for tag in soup.find_all('a', href=True):
            href: str = tag['href']
            if '/scholarships/' in href and href.count('/') >= 3:
                full = href if href.startswith('http') else 'https://www.mastersportal.eu' + href
                full = full.split('?')[0]
                if full not in links and full != self.LISTING_URL:
                    links.append(full)

        return links


class ScholarshipPortalScraper(BaseScraper):
    """
    Scraper for ScholarshipPortal - sister site to MastersPortal.
    """

    SOURCE_NAME = 'scholarshipportal'
    LISTING_URL = 'https://www.scholarshipportal.com/scholarships/'
    PAGE_SIZE = 20

    def listing_page_url(self, offset: int) -> str:
        return f'{self.LISTING_URL}?Limit={self.PAGE_SIZE}&Start={offset}'

    def extract_links(self, html: str) -> list[str]:
        soup = self.soup(html)
        links: list[str] = []

        for tag in soup.find_all('a', href=True):
            href: str = tag['href']
            if '/scholarships/' in href and href.count('/') >= 3:
                full = href if href.startswith('http') else 'https://www.scholarshipportal.com' + href
                full = full.split('?')[0]
                if full not in links and full != self.LISTING_URL:
                    links.append(full)

        return links


class OpportunitiesForAfricansScraper(BaseScraper):
    """
    Scraper for Opportunities For Africans undergraduate scholarship category.

    Source listing:
      https://www.opportunitiesforafricans.com/category/scholarships/undergraduate/
    """

    SOURCE_NAME = 'opportunitiesforafricans'
    LISTING_URL = 'https://www.opportunitiesforafricans.com/category/scholarships/undergraduate/'
    PAGE_SIZE = 1
    USE_QUICK_DEADLINE_FILTER = False

    def listing_page_url(self, offset: int) -> str:
        page_no = (offset // self.PAGE_SIZE) + 1
        if page_no <= 1:
            return self.LISTING_URL
        return f'{self.LISTING_URL}page/{page_no}/'

    def _normalize(self, href: str) -> str:
        full = urljoin(self.LISTING_URL, href)
        parsed = urlsplit(full)
        cleaned = urlunsplit((parsed.scheme, parsed.netloc, parsed.path.rstrip('/'), '', ''))
        return cleaned

    def _is_detail_link(self, url: str) -> bool:
        parsed = urlsplit(url)
        if parsed.netloc not in {'www.opportunitiesforafricans.com', 'opportunitiesforafricans.com'}:
            return False

        path = parsed.path.lower().rstrip('/')
        if not path:
            return False

        blocked_segments = (
            '/cdn-cgi/',
            '/category/',
            '/tag/',
            '/author/',
            '/page/',
            '/wp-content/',
            '/wp-json/',
            '/feed',
        )
        if any(seg in path for seg in blocked_segments):
            return False

        # Accept standard post-like paths as long as they are not blocked above.
        # OFA can use either dated permalinks (/2026/03/post-title/) or simple
        # slugs (/post-title/), so depth-based filtering is too strict.
        return len(path.strip('/')) > 0

    def extract_links(self, html: str) -> list[str]:
        soup = self.soup(html)
        links: list[str] = []
        seen: set[str] = set()

        # Prefer article links first to avoid nav/category noise.
        for article in soup.find_all('article'):
            for tag in article.find_all('a', href=True):
                full = self._normalize(tag['href'])
                if full in seen or not self._is_detail_link(full):
                    continue
                seen.add(full)
                links.append(full)

        # Fallback: broad scan if article extraction yields nothing.
        if not links:
            for tag in soup.find_all('a', href=True):
                full = self._normalize(tag['href'])
                if full in seen or not self._is_detail_link(full):
                    continue
                seen.add(full)
                links.append(full)

        return links


SCRAPER_REGISTRY: dict[str, type[BaseScraper]] = {
    'mastersportal': MastersPortalScraper,
    'scholarshipportal': ScholarshipPortalScraper,
    'opportunitiesforafricans': OpportunitiesForAfricansScraper,
}
