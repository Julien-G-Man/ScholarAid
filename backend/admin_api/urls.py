from django.urls import path
from .views import AdminStatsView, AdminUsersView, AdminUserDetailView
from messaging.views import AdminInboxView, AdminConversationView, AdminUnreadCountView, AdminDeleteMessageView

urlpatterns = [
    path('admin/stats/', AdminStatsView.as_view(), name='api-admin-stats'),
    path('admin/users/', AdminUsersView.as_view(), name='api-admin-users'),
    path('admin/users/<int:user_id>/', AdminUserDetailView.as_view(), name='api-admin-user-detail'),
    # Messaging
    path('admin/messages/', AdminInboxView.as_view(), name='api-admin-messages-inbox'),
    path('admin/messages/unread-count/', AdminUnreadCountView.as_view(), name='api-admin-messages-unread'),
    path('admin/messages/<int:user_id>/', AdminConversationView.as_view(), name='api-admin-messages-thread'),
    path('admin/messages/delete/<int:message_id>/', AdminDeleteMessageView.as_view(), name='api-admin-messages-delete'),
]
