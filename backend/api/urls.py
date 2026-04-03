"""
API v1 URL configuration — single entry point for all API routes.
  /api/v1/auth/     → authentication (login, register, logout, token)
  /api/v1/...       → general resources (scholarships, newsletter, ai-review)
"""

from django.urls import path, include

urlpatterns = [
    # Auth endpoints — separate entry file
    path('auth/', include('api.auth_urls')),

    # General API endpoints
    path('', include('api.general_urls')),
]
