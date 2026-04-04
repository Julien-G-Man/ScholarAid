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
from .tasks import run_scrape, run_ingest


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


class ScrapeView(APIView):
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
    permission_classes = [IsAdminUser]

    def get(self, request):
        data = st.read()
        csv_available = st.latest_csv_path() is not None
        return Response({**data, 'csv_available': csv_available})


class CSVDownloadView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        csv_path = st.latest_csv_path()
        if not csv_path:
            raise Http404('No scraped CSV available yet.')

        return FileResponse(
            open(csv_path, 'rb'),
            content_type='text/csv',
            as_attachment=True,
            filename=csv_path.name,
        )


class IngestView(APIView):
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

        dest = st.data_dir() / f'upload_{upload.name}'
        with dest.open('wb') as fh:
            for chunk in upload.chunks():
                fh.write(chunk)

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
