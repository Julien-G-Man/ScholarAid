from django.urls import path
from .api_views import (
    AIPreparationGuideView,
    AIReviewSessionListView,
    AIReviewSessionDetailView,
    AIReviewSubmitView,
    AIChatView,
    AIReviewViewOld,
)

urlpatterns = [
    # Preparation guides
    path('ai-prep/<int:scholarship_id>/', AIPreparationGuideView.as_view(), name='api-ai-prep-guide'),

    # Review sessions
    path('ai-prep/reviews/', AIReviewSessionListView.as_view(), name='api-ai-reviews-list'),
    path('ai-review/', AIReviewSubmitView.as_view(), name='api-ai-review-submit'),
    path('ai-review/<int:session_id>/', AIReviewSessionDetailView.as_view(), name='api-ai-review-detail'),

    # Q&A chat
    path('ai-review/<int:session_id>/chat/', AIChatView.as_view(), name='api-ai-chat'),

    # Legacy (deprecated)
    path('ai-review/<int:scholarship_id>/', AIReviewViewOld.as_view(), name='api-ai-review-old'),
]
