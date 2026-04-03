"""
Auth API URL entry point.
All authentication-related endpoints live here.
  POST   /api/v1/auth/register/         - create new user account
  POST   /api/v1/auth/login/            - obtain access + refresh tokens
  POST   /api/v1/auth/logout/           - blacklist refresh token
  POST   /api/v1/auth/token/refresh/    - get new access token
  GET    /api/v1/auth/profile/          - get current user profile
  PATCH  /api/v1/auth/profile/          - update current user profile
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from api.views.auth_views import RegisterView, LoginView, LogoutView, ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='auth-token-refresh'),
    path('profile/', ProfileView.as_view(), name='auth-profile'),
]
