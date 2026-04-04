from django.urls import path
from .views import AdminStatsView, AdminUsersView, AdminUserDetailView

urlpatterns = [
    path('admin/stats/', AdminStatsView.as_view(), name='api-admin-stats'),
    path('admin/users/', AdminUsersView.as_view(), name='api-admin-users'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='api-admin-user-detail'),
]
