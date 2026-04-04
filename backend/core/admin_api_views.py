"""
Admin-only API views for scholarship management.

  POST /api/v1/admin/scholarships/extract/  — AI-powered field extraction from URL or text
  POST /api/v1/admin/scholarships/          — Create a scholarship after review
"""

import json
import re
from html.parser import HTMLParser

import anthropic
import requests
from django.conf import settings
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Scholarships
from .serializers import ScholarshipSerializer


# ─── HTML stripping ───────────────────────────────────────────────────────────

class _TextExtractor(HTMLParser):
    """Minimal HTML → plain text stripper using the stdlib."""

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


# ─── Claude extraction helper ─────────────────────────────────────────────────

_EXTRACTION_PROMPT = """\
You are an expert scholarship data extractor. Extract scholarship information from the provided text and return ONLY a valid JSON object — no markdown, no prose, no explanation.

Extract these fields:
- name: string — full scholarship name
- provider: string — organisation offering the scholarship (e.g. "Gates Foundation")
- institution: string or null — target university/institution if specified
- level: string or null — academic level ("Undergraduate", "Postgraduate", "PhD", "All", etc.)
- description: string — concise 2-4 sentence summary of the scholarship
- eligibility: string or null — eligibility criteria as a readable paragraph
- essay_prompt: string or null — essay or personal statement prompt if mentioned
- deadline: string or null — application deadline in YYYY-MM-DD format; null if not found
- link: string or null — direct application/info URL; null if not found
- logo_url: string or null — URL of provider logo; null if not found

Return exactly this JSON structure (no extra keys):
{
  "name": "...",
  "provider": "...",
  "institution": null,
  "level": null,
  "description": "...",
  "eligibility": null,
  "essay_prompt": null,
  "deadline": null,
  "link": null,
  "logo_url": null
}

Text to extract from:
"""

_JSON_RE = re.compile(r'\{[\s\S]*\}')


def _extract_via_claude(text: str) -> dict:
    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)

    # Truncate to ~30k chars to stay well within context limits
    content = text[:30_000]

    message = client.messages.create(
        model='claude-opus-4-6',
        max_tokens=2048,
        thinking={'type': 'adaptive'},
        messages=[
            {'role': 'user', 'content': _EXTRACTION_PROMPT + content}
        ],
    )

    # Find the text block (thinking blocks may precede it)
    raw_text = ''
    for block in message.content:
        if block.type == 'text':
            raw_text = block.text
            break

    # Extract JSON from the response (tolerant of any surrounding prose)
    match = _JSON_RE.search(raw_text)
    if not match:
        raise ValueError('Claude did not return a JSON object.')

    return json.loads(match.group())


# ─── Views ────────────────────────────────────────────────────────────────────

class ScholarshipExtractView(APIView):
    """
    POST /api/v1/admin/scholarships/extract/

    Body:
      { "input_type": "url" | "text", "content": "<url or raw text>" }

    Returns pre-filled scholarship fields extracted by Claude.
    Requires admin (is_staff) privileges.
    """

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

        # If URL, fetch and strip HTML
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
            return Response(
                {'error': 'ANTHROPIC_API_KEY is not configured on the server.'},
                status=503,
            )

        try:
            extracted = _extract_via_claude(content)
        except (ValueError, json.JSONDecodeError) as exc:
            return Response({'error': f'Extraction failed: {exc}'}, status=502)
        except anthropic.APIError as exc:
            return Response({'error': f'Claude API error: {exc}'}, status=502)

        return Response(extracted)


class AdminScholarshipCreateView(APIView):
    """
    POST /api/v1/admin/scholarships/

    Creates a new scholarship from reviewed/edited extracted fields.
    Requires admin (is_staff) privileges.
    """

    permission_classes = [IsAdminUser]

    def post(self, request):
        serializer = ScholarshipSerializer(data=request.data)
        if serializer.is_valid():
            scholarship = serializer.save()
            return Response(ScholarshipSerializer(scholarship).data, status=201)
        return Response(serializer.errors, status=400)
