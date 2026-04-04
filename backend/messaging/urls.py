from django.urls import path
from .views import UserThreadView, UserUnreadCountView

urlpatterns = [
    path('messages/', UserThreadView.as_view(), name='api-messages-thread'),
    path('messages/unread-count/', UserUnreadCountView.as_view(), name='api-messages-unread'),
]
