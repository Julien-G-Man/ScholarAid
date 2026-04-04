from django.urls import path

from .views import ScrapeView, ScrapeStatusView, CSVDownloadView, IngestView

urlpatterns = [
    path('admin/scraper/scrape/', ScrapeView.as_view(), name='admin-scraper-scrape'),
    path('admin/scraper/status/', ScrapeStatusView.as_view(), name='admin-scraper-status'),
    path('admin/scraper/download/', CSVDownloadView.as_view(), name='admin-scraper-download'),
    path('admin/scraper/ingest/', IngestView.as_view(), name='admin-scraper-ingest'),
]
