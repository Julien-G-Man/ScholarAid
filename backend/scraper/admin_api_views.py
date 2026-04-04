"""
Admin-only API views for the scholarship scraper pipeline.

  POST /api/v1/admin/scraper/scrape/     — trigger a background scrape job
  GET  /api/v1/admin/scraper/status/     — poll job status
  GET  /api/v1/admin/scraper/download/   — download the latest scraped CSV
  POST /api/v1/admin/scraper/ingest/     — upload a CSV file and ingest it
"""

import threading
from datetime import datetime
from pathlib import Path

from django.http import FileResponse, Http404
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from . import status as st
from .scrapers.mastersportal import SCRAPER_REGISTRY
from .tasks import run_scrape, run_ingest, CSV_FIELDS


# ── Background thread helpers ─────────────────────────────────────────────────

def _scrape_in_background(source: str, limit: int, csv_path: Path):
    try:
        run_scrape(source=source, limit=limit, output_path=csv_path)
    except Exception as exc:
        st.scrape_error(str(exc))


def _ingest_in_background(csv_path: Path):
    try:
        run_ingest(csv_path)
    except Exception as exc:
        st.ingest_error(str(exc))


# ── Views ─────────────────────────────────────────────────────────────────────

class ScrapeView(APIView):
    """
    POST /api/v1/admin/scraper/scrape/

    Body (JSON):
      { "source": "mastersportal", "limit": 500 }

    Starts a background scrape job.  Returns 202 immediately.
    Poll /scraper/status/ for progress.
    """

    permission_classes = [IsAdminUser]

    def post(self, request):
        current = st.read().get('scrape', {})
        if current.get('state') == 'running':
            return Response({'error': 'A scrape job is already running.'}, status=409)

        source = request.data.get('source', 'mastersportal')
        limit = int(request.data.get('limit', 500))

        if source not in SCRAPER_REGISTRY:
            return Response(
                {'error': f'Unknown source. Available: {", ".join(SCRAPER_REGISTRY)}'},
                status=400,
            )

        stamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        csv_path = st.data_dir() / f'scholarships_{source}_{stamp}.csv'

        t = threading.Thread(
            target=_scrape_in_background,
            args=(source, limit, csv_path),
            daemon=True,
        )
        t.start()

        return Response(
            {'message': f'Scrape job started (source={source}, limit={limit}).'},
            status=202,
        )


class ScrapeStatusView(APIView):
    """
    GET /api/v1/admin/scraper/status/

    Returns the current state of both scrape and ingest jobs.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        data = st.read()
        # Add download availability flag
        csv_available = st.latest_csv_path() is not None
        return Response({**data, 'csv_available': csv_available})


class CSVDownloadView(APIView):
    """
    GET /api/v1/admin/scraper/download/

    Serves the most recently scraped CSV file as a download.
    Returns 404 if no CSV exists yet.
    """

    permission_classes = [IsAdminUser]

    def get(self, request):
        csv_path = st.latest_csv_path()
        if not csv_path:
            raise Http404('No scraped CSV available yet.')

        response = FileResponse(
            open(csv_path, 'rb'),
            content_type='text/csv',
            as_attachment=True,
            filename=csv_path.name,
        )
        return response


class IngestView(APIView):
    """
    POST /api/v1/admin/scraper/ingest/

    Accepts a multipart CSV file upload and ingests it into the database.
    The file must have the columns: name, provider, institution, level,
    description, eligibility, essay_prompt, deadline, link, logo_url.

    Ingestion runs synchronously (file is small enough that async is unnecessary).
    For large files the background thread approach used by ScrapeView can be applied.
    """

    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        current = st.read().get('ingest', {})
        if current.get('state') == 'running':
            return Response({'error': 'An ingest job is already running.'}, status=409)

        upload = request.FILES.get('csv_file')
        if not upload:
            return Response({'error': 'No csv_file provided in the request.'}, status=400)

        if not upload.name.endswith('.csv'):
            return Response({'error': 'Uploaded file must be a .csv'}, status=400)

        # Save uploaded file to data dir
        dest = st.data_dir() / f'upload_{upload.name}'
        with dest.open('wb') as fh:
            for chunk in upload.chunks():
                fh.write(chunk)

        # Run ingest in background so the request returns quickly
        t = threading.Thread(
            target=_ingest_in_background,
            args=(dest,),
            daemon=True,
        )
        t.start()

        return Response(
            {'message': f'Ingestion started for {upload.name}. Poll /scraper/status/ for results.'},
            status=202,
        )
