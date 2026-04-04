from django.urls import path
from .views import (
    AdminStatsView,
    AdminUsersView,
    AdminUserDetailView,
    AdminInboxView,
    AdminConversationView,
    AdminUnreadCountView,
    AdminDeleteMessageView,
    ScholarshipExtractView,
    AdminScholarshipCreateView,
)

urlpatterns = [
    path('admin/stats/', AdminStatsView.as_view(), name='api-admin-stats'),
    path('admin/users/', AdminUsersView.as_view(), name='api-admin-users'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='api-admin-user-detail'),
    path('admin/scholarships/extract/', ScholarshipExtractView.as_view(), name='admin-scholarship-extract'),
    path('admin/scholarships/', AdminScholarshipCreateView.as_view(), name='admin-scholarship-create'),
    # Messaging
    path('admin/messages/', AdminInboxView.as_view(), name='api-admin-messages-inbox'),
    path('admin/messages/unread-count/', AdminUnreadCountView.as_view(), name='api-admin-messages-unread'),
    path('admin/messages/<int:user_id>/', AdminConversationView.as_view(), name='api-admin-messages-thread'),
    path('admin/messages/delete/<int:message_id>/', AdminDeleteMessageView.as_view(), name='api-admin-messages-delete'),
]
