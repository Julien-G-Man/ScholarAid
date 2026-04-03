"""
API v1 URL router — routes to each Django app's own api_urls.py.
Each app owns its serializers, views and URL patterns for clear separation of concern.

  /api/v1/health/         → health check
  /api/v1/auth/           → users.api_urls
  /api/v1/                → core.api_urls  (scholarships, newsletter)
  /api/v1/                → ai_review.api_urls
"""

from django.urls import path, include
from rest_framework.response import Response
from rest_framework.views import APIView

class HealthCheckView(APIView):
    """Simple health check endpoint for monitoring and deployment readiness."""
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        return Response({'status': 'healthy', 'service': 'ScholarAid API v1'})

urlpatterns = [
    # Health check
    path('health/', HealthCheckView.as_view(), name='api-health'),

    # Authentication — owned by the users app
    path('auth/', include('users.api_urls')),

    # Scholarships + newsletter — owned by the core app
    path('', include('core.api_urls')),

    # AI essay review — owned by the ai_review app
    path('', include('ai_review.api_urls')),
]

