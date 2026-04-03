from django.urls import path
from .api_views import AIReviewView

urlpatterns = [
    path('ai-review/<int:scholarship_id>/', AIReviewView.as_view(), name='api-ai-review'),
]
