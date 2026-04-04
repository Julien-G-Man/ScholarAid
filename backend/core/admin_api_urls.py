from django.urls import path
from .admin_api_views import ScholarshipExtractView, AdminScholarshipCreateView

urlpatterns = [
    path('scholarships/extract/', ScholarshipExtractView.as_view(), name='admin-scholarship-extract'),
    path('scholarships/', AdminScholarshipCreateView.as_view(), name='admin-scholarship-create'),
]
