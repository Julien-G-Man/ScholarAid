import json
import re
from html.parser import HTMLParser
from datetime import timedelta

import anthropic
import requests
from django.conf import settings
from django.contrib.auth.models import User
from django.db.models import Avg, Count, Q
from django.utils import timezone
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.views import APIView

from core.models import ContactMessage, NewsletterSubscription, Scholarships
from core.serializers import ScholarshipSerializer
from ai_review.models import AIReviewSession, ChatMessage
from messaging.models import Message


class AdminStatsView(APIView):
    """GET /api/v1/admin/stats/

    Platform-wide aggregated stats for the admin dashboard.
    Restricted to staff/superuser accounts.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        week_ago = timezone.now() - timedelta(days=7)

        # ── Platform ──────────────────────────────────────────────────────────
        total_users = User.objects.filter(is_superuser=False).count()
        new_users_this_week = User.objects.filter(
            is_superuser=False, date_joined__gte=week_ago
        ).count()
        total_scholarships = Scholarships.objects.count()
        newsletter_subs = NewsletterSubscription.objects.count()
        unread_messages = Message.objects.filter(
            recipient=request.user, is_read=False, sender__is_superuser=False
        ).count()
        total_messages = ContactMessage.objects.count()

        # ── AI Activity ───────────────────────────────────────────────────────
        sessions = AIReviewSession.objects.all()
        total_sessions = sessions.count()
        in_progress = sessions.filter(status='in_progress').count()
        submitted = sessions.filter(status='submitted').count()
        reviewed = sessions.filter(status='reviewed').count()
        archived = sessions.filter(status='archived').count()
        sessions_this_week = sessions.filter(updated_at__gte=week_ago).count()

        avg_result = sessions.filter(
            feedback__isnull=False
        ).aggregate(avg=Avg('feedback__overall_score'))
        avg_score = round(avg_result['avg']) if avg_result['avg'] else 0

        total_user_messages = ChatMessage.objects.filter(role='user').count()

        return Response({
            'platform': {
                'total_users': total_users,
                'new_users_this_week': new_users_this_week,
                'total_scholarships': total_scholarships,
                'newsletter_subscribers': newsletter_subs,
                'total_contact_messages': total_messages,
                'unread_messages': unread_messages,
            },
            'ai': {
                'total_sessions': total_sessions,
                'in_progress': in_progress,
                'submitted': submitted,
                'reviewed': reviewed,
                'archived': archived,
                'avg_score': avg_score,
                'total_chat_messages': total_user_messages,
                'sessions_this_week': sessions_this_week,
            },
        })


class AdminUsersView(APIView):
    """GET /api/v1/admin/users/

    All non-superuser accounts with per-user activity summary.
    Restricted to staff/superuser accounts.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        users = (
            User.objects
            .filter(is_superuser=False)
            .annotate(
                sessions_total=Count('ai_sessions', distinct=True),
                sessions_reviewed=Count(
                    'ai_sessions',
                    filter=Q(ai_sessions__status='reviewed'),
                    distinct=True,
                ),
                avg_score=Avg('ai_sessions__feedback__overall_score'),
                questions_asked=Count(
                    'ai_sessions__chat_messages',
                    filter=Q(ai_sessions__chat_messages__role='user'),
                ),
            )
            .order_by('-date_joined')
        )

        data = []
        for u in users:
            # Most recent session's updated_at as "last active"
            last_session = (
                AIReviewSession.objects
                .filter(user=u)
                .order_by('-updated_at')
                .values_list('updated_at', flat=True)
                .first()
            )
            data.append({
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'date_joined': u.date_joined.isoformat(),
                'is_active': u.is_active,
                'is_staff': u.is_staff,
                'sessions_total': u.sessions_total,
                'sessions_reviewed': u.sessions_reviewed,
                'avg_score': round(u.avg_score) if u.avg_score else None,
                'questions_asked': u.questions_asked,
                'last_active': last_session.isoformat() if last_session else None,
            })

        return Response(data)


class AdminUserDetailView(APIView):
    """GET /api/v1/admin/users/{user_id}/

    Full profile + every session (with feedback & chat) for one user.
    Restricted to staff/superuser accounts.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, user_id):
        try:
            u = User.objects.select_related('profile').get(pk=user_id, is_superuser=False)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        profile = getattr(u, 'profile', None)

        sessions_qs = (
            AIReviewSession.objects
            .filter(user=u)
            .select_related('scholarship', 'feedback')
            .prefetch_related('chat_messages')
            .order_by('-updated_at')
        )

        sessions = []
        for s in sessions_qs:
            fb = getattr(s, 'feedback', None)
            sessions.append({
                'id': s.id,
                'scholarship_id': s.scholarship_id,
                'scholarship_name': s.scholarship.name,
                'status': s.status,
                'notes': s.notes,
                'created_at': s.created_at.isoformat(),
                'updated_at': s.updated_at.isoformat(),
                'feedback': {
                    'overall_score': fb.overall_score,
                    'structure_feedback': fb.structure_feedback,
                    'clarity_feedback': fb.clarity_feedback,
                    'relevance_feedback': fb.relevance_feedback,
                    'persuasiveness_feedback': fb.persuasiveness_feedback,
                    'grammar_feedback': fb.grammar_feedback,
                    'strengths': fb.strengths,
                    'improvements': fb.improvements,
                    'next_steps': fb.next_steps,
                    'reviewed_at': fb.reviewed_at.isoformat(),
                } if fb else None,
                'chat_messages': [
                    {
                        'id': m.id,
                        'role': m.role,
                        'content': m.content,
                        'created_at': m.created_at.isoformat(),
                    }
                    for m in s.chat_messages.all()
                ],
            })

        return Response({
            'user': {
                'id': u.id,
                'username': u.username,
                'email': u.email,
                'first_name': u.first_name,
                'last_name': u.last_name,
                'date_joined': u.date_joined.isoformat(),
                'is_active': u.is_active,
                'is_staff': u.is_staff,
                'profile': {
                    'institution': profile.institution if profile else '',
                    'field_of_study': profile.field_of_study if profile else '',
                    'country': profile.country if profile else '',
                    'bio': profile.bio if profile else '',
                },
            },
            'sessions': sessions,
        })


def _serialize_admin_message(msg: Message, viewer_id: int) -> dict:
    sender_is_admin = msg.sender.is_staff or msg.sender.is_superuser
    return {
        'id': msg.id,
        'content': msg.content,
        'sender_id': msg.sender_id,
        'sender_name': 'Support' if sender_is_admin else (
            f'{msg.sender.first_name} {msg.sender.last_name}'.strip() or msg.sender.username
        ),
        'is_mine': msg.sender_id == viewer_id,
        'is_broadcast': msg.recipient_id is None,
        'is_read': msg.is_read,
        'created_at': msg.created_at.isoformat(),
    }


class AdminInboxView(APIView):
    """GET /api/v1/admin/messages/

    Returns all user conversation threads (summary) for the admin.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        admin = request.user
        messages = (
            Message.objects
            .filter(
                Q(sender=admin) | Q(recipient=admin),
                recipient__isnull=False,
            )
            .select_related('sender', 'recipient')
            .order_by('created_at')
        )

        conversations: dict = {}
        for msg in messages:
            other = msg.recipient if msg.sender_id == admin.id else msg.sender
            if other.id not in conversations:
                conversations[other.id] = {
                    'user_id': other.id,
                    'username': other.username,
                    'first_name': other.first_name,
                    'last_name': other.last_name,
                    'last_message': None,
                    'unread': 0,
                }
            conversations[other.id]['last_message'] = {
                'content': msg.content,
                'created_at': msg.created_at.isoformat(),
                'is_mine': msg.sender_id == admin.id,
            }
            if not msg.is_read and msg.sender_id != admin.id:
                conversations[other.id]['unread'] += 1

        result = sorted(
            conversations.values(),
            key=lambda c: c['last_message']['created_at'] if c['last_message'] else '',
            reverse=True,
        )
        return Response(result)


class AdminUnreadCountView(APIView):
    """GET /api/v1/admin/messages/unread-count/

    Total unread messages from users to admin.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        count = Message.objects.filter(
            recipient=request.user,
            is_read=False,
            sender__is_superuser=False,
        ).count()
        return Response({'unread': count})


class AdminDeleteMessageView(APIView):
    """DELETE /api/v1/admin/messages/delete/{message_id}/

    Permanently delete a single message. Admin only.
    """
    permission_classes = [IsAdminUser]

    def delete(self, request, message_id):
        try:
            msg = Message.objects.get(pk=message_id)
        except Message.DoesNotExist:
            return Response({'error': 'Message not found.'}, status=404)
        msg.delete()
        return Response(status=204)


class AdminConversationView(APIView):
    """GET /api/v1/admin/messages/{user_id}/

    Full message thread between admin and a specific user.
    Also marks that user's messages to admin as read.
    """
    permission_classes = [IsAdminUser]

    def get(self, request, user_id):
        admin = request.user
        try:
            other = User.objects.get(pk=user_id, is_superuser=False)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=404)

        messages = (
            Message.objects
            .filter(
                Q(sender=admin, recipient=other) |
                Q(sender=other, recipient=admin)
            )
            .select_related('sender', 'recipient')
            .order_by('created_at')
        )
        Message.objects.filter(
            sender=other, recipient=admin, is_read=False
        ).update(is_read=True)

        return Response([_serialize_admin_message(m, admin.id) for m in messages])


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


_EXTRACTION_PROMPT = """\
You are an expert scholarship data extractor. Extract scholarship information from the provided text and return ONLY a valid JSON object - no markdown, no prose, no explanation.

Extract these fields:
- name: string - full scholarship name
- provider: string - organisation offering the scholarship (e.g. "Gates Foundation")
- institution: string or null - target university/institution if specified
- level: string or null - academic level ("Undergraduate", "Postgraduate", "PhD", "All", etc.)
- description: string - concise 2-4 sentence summary of the scholarship
- eligibility: string or null - eligibility criteria as a readable paragraph
- essay_prompt: string or null - essay or personal statement prompt if mentioned
- deadline: string or null - application deadline in YYYY-MM-DD format; null if not found
- link: string or null - direct application/info URL; null if not found
- logo_url: string or null - URL of provider logo; null if not found

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

    def post(self, request):
        serializer = ScholarshipSerializer(data=request.data)
        if serializer.is_valid():
            scholarship = serializer.save()
            return Response(ScholarshipSerializer(scholarship).data, status=201)
        return Response(serializer.errors, status=400)
