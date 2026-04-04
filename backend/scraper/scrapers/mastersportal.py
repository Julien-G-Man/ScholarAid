"""
Scraper for MastersPortal.eu scholarships.

Listing:  https://www.mastersportal.eu/scholarships/?Limit=20&Start=0
Detail:   https://www.mastersportal.eu/scholarships/<id>/name.html

MastersPortal renders most content server-side, so standard requests +
BeautifulSoup works for link extraction. Full field extraction is done
by the Claude pipeline after fetching the detail page.
"""

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

        # MastersPortal scholarship cards use <article> or <li> wrappers
        # with an <a> pointing to /scholarships/<id>/...
        for tag in soup.find_all('a', href=True):
            href: str = tag['href']
            if '/scholarships/' in href and href.count('/') >= 3:
                if href.startswith('http'):
                    full = href
                else:
                    full = 'https://www.mastersportal.eu' + href
                # Normalise: strip query strings from detail URLs
                full = full.split('?')[0]
                if full not in links and full != self.LISTING_URL:
                    links.append(full)

        return links


class ScholarshipPortalScraper(BaseScraper):
    """
    Scraper for ScholarshipPortal.eu — sister site to MastersPortal.
    Shares a near-identical URL and HTML structure.
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
                if href.startswith('http'):
                    full = href
                else:
                    full = 'https://www.scholarshipportal.com' + href
                full = full.split('?')[0]
                if full not in links and full != self.LISTING_URL:
                    links.append(full)

        return links


# Registry — maps the --source CLI flag to the corresponding class
SCRAPER_REGISTRY: dict[str, type[BaseScraper]] = {
    'mastersportal':    MastersPortalScraper,
    'scholarshipportal': ScholarshipPortalScraper,
}
