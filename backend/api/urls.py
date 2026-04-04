"""
API v1 URL router — routes to each Django app's own api_urls.py.
Each app owns its serializers, views and URL patterns for clear separation of concern.

  /api/v1/auth/          → users.api_urls
  /api/v1/               → core.api_urls  (scholarships, newsletter)
  /api/v1/               → ai_review.api_urls
  /api/v1/admin/         → core.admin_api_urls  (admin scholarship intake)
"""

from django.urls import path, include

urlpatterns = [
    # Authentication — owned by the users app
    path('auth/', include('users.api_urls')),

    # Scholarships + newsletter — owned by the core app
    path('', include('core.api_urls')),

    # AI essay review — owned by the ai_review app
    path('', include('ai_review.api_urls')),

    # Admin-only scholarship management (AI intake, create)
    path('admin/', include('core.admin_api_urls')),
]
