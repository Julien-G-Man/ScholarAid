from django.urls import path
from .admin_api_views import ScrapeView, ScrapeStatusView, CSVDownloadView, IngestView

urlpatterns = [
    path('scraper/scrape/',    ScrapeView.as_view(),       name='admin-scraper-scrape'),
    path('scraper/status/',    ScrapeStatusView.as_view(), name='admin-scraper-status'),
    path('scraper/download/',  CSVDownloadView.as_view(),  name='admin-scraper-download'),
    path('scraper/ingest/',    IngestView.as_view(),       name='admin-scraper-ingest'),
]
