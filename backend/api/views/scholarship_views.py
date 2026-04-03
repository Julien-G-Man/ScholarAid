from rest_framework import generics
from rest_framework.permissions import AllowAny
from core.models import Scholarships
from api.serializers import ScholarshipSerializer


class ScholarshipListView(generics.ListAPIView):
    """GET /api/v1/scholarships/ — paginated list of all scholarships."""
    queryset = Scholarships.objects.all().order_by('-created_at')
    serializer_class = ScholarshipSerializer
    permission_classes = [AllowAny]


class ScholarshipDetailView(generics.RetrieveAPIView):
    """GET /api/v1/scholarships/<id>/ — single scholarship detail."""
    queryset = Scholarships.objects.all()
    serializer_class = ScholarshipSerializer
    permission_classes = [AllowAny]


class FeaturedScholarshipsView(generics.ListAPIView):
    """GET /api/v1/scholarships/featured/ — 3 most recent scholarships for homepage."""
    serializer_class = ScholarshipSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Scholarships.objects.order_by('-created_at')[:3]
