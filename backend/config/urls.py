from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework.schemas import get_schema_view


class HealthCheckView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, request):
        return Response({'status': 'healthy', 'service': 'ScholarAid API v1'})


schema_view = get_schema_view(
    title='ScholarAid API',
    description='Built-in DRF OpenAPI schema for ScholarAid backend.',
    version='1.0.0',
    public=True,
    permission_classes=[AllowAny],
)

urlpatterns = [
    path('', RedirectView.as_view(pattern_name='api-schema', permanent=False)),
    path('api/docs/', RedirectView.as_view(pattern_name='api-schema', permanent=False)),
    path('api/schema/', schema_view, name='api-schema'),
    path('api-auth/', include('rest_framework.urls')),
    path('admin/', admin.site.urls),
    path('api/v1/health/', HealthCheckView.as_view(), name='api-health'),
    path('api/v1/auth/', include('users.api_urls')),
    path('api/v1/', include('core.api_urls')),
    path('api/v1/', include('ai_review.api_urls')),
    path('api/v1/', include('admin_api.urls')),
    path('api/v1/', include('scraper.urls')),
    path('api/v1/', include('messaging.urls')),
]

# Serve uploaded media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
