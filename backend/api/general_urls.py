"""
General API URL entry point.
All non-auth resource endpoints live here.
  GET    /api/v1/scholarships/              - list all scholarships (paginated)
  GET    /api/v1/scholarships/featured/     - 3 most-recent featured scholarships
  GET    /api/v1/scholarships/<id>/         - scholarship detail
  POST   /api/v1/newsletter/subscribe/      - subscribe to newsletter
  POST   /api/v1/ai-review/<scholarship_id>/ - submit essay for AI review
"""

from django.urls import path
from api.views.scholarship_views import ScholarshipListView, ScholarshipDetailView, FeaturedScholarshipsView
from api.views.newsletter_views import NewsletterSubscribeView
from api.views.ai_review_views import AIReviewView

urlpatterns = [
    # Scholarships
    path('scholarships/', ScholarshipListView.as_view(), name='api-scholarships'),
    path('scholarships/featured/', FeaturedScholarshipsView.as_view(), name='api-scholarships-featured'),
    path('scholarships/<int:pk>/', ScholarshipDetailView.as_view(), name='api-scholarship-detail'),

    # Newsletter
    path('newsletter/subscribe/', NewsletterSubscribeView.as_view(), name='api-newsletter-subscribe'),

    # AI Review
    path('ai-review/<int:scholarship_id>/', AIReviewView.as_view(), name='api-ai-review'),
]
