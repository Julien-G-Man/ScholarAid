from django.urls import path
from .api_views import (
    ScholarshipListView,
    ScholarshipDetailView,
    FeaturedScholarshipsView,
    NewsletterSubscribeView,
)

urlpatterns = [
    path('scholarships/', ScholarshipListView.as_view(), name='api-scholarships'),
    # featured must come before <pk>/ so it isn't captured as a pk lookup
    path('scholarships/featured/', FeaturedScholarshipsView.as_view(), name='api-scholarships-featured'),
    path('scholarships/<int:pk>/', ScholarshipDetailView.as_view(), name='api-scholarship-detail'),
    path('newsletter/subscribe/', NewsletterSubscribeView.as_view(), name='api-newsletter-subscribe'),
]
