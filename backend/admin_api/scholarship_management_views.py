import json
import re
from html.parser import HTMLParser

import anthropic
import requests
from django.conf import settings
from django.db.models import Q
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import Scholarships
from core.serializers import ScholarshipSerializer
from .prompts import _EXTRACTION_PROMPT


class _TextExtractor(HTMLParser):
    def __init__(self):
        super().__init__()
        self._chunks: list[str] = []
        self._skip_tags = {'script', 'style', 'noscript', 'head', 'meta', 'link'}
        self._current_skip = 0

    def handle_starttag(self, tag, attrs):
        if tag in self._skip_tags:
            self._current_skip += 1

    def handle_endtag(self, tag):
        if tag in self._skip_tags and self._current_skip > 0:
            self._current_skip -= 1

    def handle_data(self, data):
        if self._current_skip == 0:
            stripped = data.strip()
            if stripped:
                self._chunks.append(stripped)

    def get_text(self) -> str:
        return ' '.join(self._chunks)


def _html_to_text(html: str) -> str:
    parser = _TextExtractor()
    parser.feed(html)
    return parser.get_text()


_JSON_RE = re.compile(r'\{[\s\S]*\}')


def _extract_via_claude(text: str) -> dict:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    content = text[:30_000]

    message = client.messages.create(
        model='claude-opus-4-6',
        max_tokens=2048,
        thinking={'type': 'adaptive'},
        messages=[{'role': 'user', 'content': _EXTRACTION_PROMPT + content}],
    )

    raw_text = ''
    for block in message.content:
        if block.type == 'text':
            raw_text = block.text
            break

    match = _JSON_RE.search(raw_text)
    if not match:
        raise ValueError('Claude did not return a JSON object.')

    return json.loads(match.group())


class ScholarshipExtractView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request):
        input_type = request.data.get('input_type', '').strip()
        content = request.data.get('content', '').strip()

        if not input_type or not content:
            return Response(
                {'error': 'Both input_type ("url" or "text") and content are required.'},
                status=400,
            )

        if input_type not in ('url', 'text'):
            return Response({'error': 'input_type must be "url" or "text".'}, status=400)

        if input_type == 'url':
            try:
                resp = requests.get(
                    content,
                    timeout=15,
                    headers={'User-Agent': 'ScholarAid/1.0 (scholarship intake bot)'},
                )
                resp.raise_for_status()
            except requests.RequestException as exc:
                return Response({'error': f'Failed to fetch URL: {exc}'}, status=400)
            content = _html_to_text(resp.text)

        if not settings.ANTHROPIC_API_KEY:
            return Response({'error': 'ANTHROPIC_API_KEY is not configured on the server.'}, status=503)

        try:
            extracted = _extract_via_claude(content)
        except (ValueError, json.JSONDecodeError) as exc:
            return Response({'error': f'Extraction failed: {exc}'}, status=502)
        except anthropic.APIError as exc:
            return Response({'error': f'Claude API error: {exc}'}, status=502)

        return Response(extracted)


class AdminScholarshipCreateView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = Scholarships.objects.all().order_by('-created_at', '-id')

        search = (request.query_params.get('search') or '').strip()
        provider = (request.query_params.get('provider') or '').strip()
        level = (request.query_params.get('level') or '').strip()
        year = (request.query_params.get('year') or '').strip()

        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(provider__icontains=search)
                | Q(institution__icontains=search)
            )
        if provider:
            qs = qs.filter(provider__icontains=provider)
        if level:
            qs = qs.filter(level__icontains=level)
        if year:
            if not year.isdigit():
                return Response({'error': 'year must be numeric.'}, status=400)
            qs = qs.filter(
                Q(name__icontains=year)
                | Q(description__icontains=year)
                | Q(deadline__year=int(year))
            )

        try:
            limit = max(1, min(int(request.query_params.get('limit', 50)), 200))
            offset = max(0, int(request.query_params.get('offset', 0)))
        except ValueError:
            return Response({'error': 'limit and offset must be integers.'}, status=400)

        total = qs.count()
        results = qs[offset:offset + limit]
        serializer = ScholarshipSerializer(results, many=True)
        next_offset = offset + limit if (offset + limit) < total else None
        prev_offset = offset - limit if offset - limit >= 0 else None

        return Response(
            {
                'count': total,
                'next_offset': next_offset,
                'prev_offset': prev_offset,
                'results': serializer.data,
            }
        )

    def post(self, request):
        serializer = ScholarshipSerializer(data=request.data)
        if serializer.is_valid():
            scholarship = serializer.save()
            return Response(ScholarshipSerializer(scholarship).data, status=201)
        return Response(serializer.errors, status=400)


class AdminScholarshipDetailView(APIView):
    """GET/PATCH/DELETE /api/v1/admin/scholarships/{scholarship_id}/"""
    permission_classes = [IsAdminUser]

    def get(self, request, scholarship_id):
        try:
            scholarship = Scholarships.objects.get(pk=scholarship_id)
        except Scholarships.DoesNotExist:
            return Response({'error': 'Scholarship not found.'}, status=404)
        return Response(ScholarshipSerializer(scholarship).data)

    def patch(self, request, scholarship_id):
        try:
            scholarship = Scholarships.objects.get(pk=scholarship_id)
        except Scholarships.DoesNotExist:
            return Response({'error': 'Scholarship not found.'}, status=404)

        serializer = ScholarshipSerializer(scholarship, data=request.data, partial=True)
        if serializer.is_valid():
            updated = serializer.save()
            return Response(ScholarshipSerializer(updated).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, scholarship_id):
        try:
            scholarship = Scholarships.objects.get(pk=scholarship_id)
        except Scholarships.DoesNotExist:
            return Response({'error': 'Scholarship not found.'}, status=404)

        scholarship.delete()
        return Response(status=204)


class AdminScholarshipBulkDeleteView(APIView):
    """
    POST /api/v1/admin/scholarships/bulk-delete/

    Supports safe bulk deletion with optional filters:
      - years: [2021, 2022]  (matches year token in name/description)
      - deadline_year_lte: 2022
      - provider_contains: "opportunitiesforafricans"
      - name_contains: "2021"
      - description_contains: "2021"
      - dry_run: true|false (default: true)
      - confirm: true required when dry_run=false
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        delete_all = bool(request.data.get('delete_all', False))
        years = request.data.get('years') or []
        deadline_year_lte = request.data.get('deadline_year_lte')
        provider_contains = (request.data.get('provider_contains') or '').strip()
        name_contains = (request.data.get('name_contains') or '').strip()
        description_contains = (request.data.get('description_contains') or '').strip()
        dry_run = bool(request.data.get('dry_run', True))
        confirm = bool(request.data.get('confirm', False))

        qs = Scholarships.objects.all()
        filters = Q()
        has_filter = False

        if isinstance(years, list) and years:
            year_terms = [str(y).strip() for y in years if str(y).strip().isdigit()]
            if not year_terms:
                return Response({'error': 'years must contain integer-like values.'}, status=400)

            year_q = Q()
            for term in year_terms:
                year_q |= Q(name__icontains=term) | Q(description__icontains=term)
            filters &= year_q
            has_filter = True

        if deadline_year_lte is not None:
            try:
                year = int(deadline_year_lte)
            except (TypeError, ValueError):
                return Response({'error': 'deadline_year_lte must be an integer year.'}, status=400)
            filters &= Q(deadline__year__lte=year)
            has_filter = True

        if provider_contains:
            filters &= Q(provider__icontains=provider_contains)
            has_filter = True

        if name_contains:
            filters &= Q(name__icontains=name_contains)
            has_filter = True

        if description_contains:
            filters &= Q(description__icontains=description_contains)
            has_filter = True

        if not has_filter and not delete_all:
            return Response(
                {'error': 'At least one filter is required unless delete_all=true.'},
                status=400,
            )
        if has_filter:
            qs = qs.filter(filters)
        matches = qs.count()

        if dry_run:
            return Response(
                {
                    'dry_run': True,
                    'matches': matches,
                    'message': 'Dry run complete. Set dry_run=false and confirm=true to execute deletion.',
                }
            )

        if not confirm:
            return Response(
                {'error': 'confirm=true is required when dry_run=false.'},
                status=400,
            )

        deleted, _ = qs.delete()
        return Response(
            {
                'dry_run': False,
                'matches': matches,
                'deleted': deleted,
                'message': 'Bulk deletion completed.',
            }
        )
