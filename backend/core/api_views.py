from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Scholarships, NewsletterSubscription
from .serializers import ScholarshipSerializer, NewsletterSubscribeSerializer


class ScholarshipListView(generics.ListAPIView):
    """GET /api/v1/scholarships/ — paginated list of all scholarships."""
    queryset = Scholarships.objects.all().order_by('-created_at')
    serializer_class = ScholarshipSerializer
    permission_classes = [AllowAny]


class ScholarshipDetailView(generics.RetrieveAPIView):
    """GET /api/v1/scholarships/<pk>/ — single scholarship detail."""
    queryset = Scholarships.objects.all()
    serializer_class = ScholarshipSerializer
    permission_classes = [AllowAny]


class FeaturedScholarshipsView(generics.ListAPIView):
    """GET /api/v1/scholarships/featured/ — 3 most-recent scholarships for the homepage."""
    serializer_class = ScholarshipSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        return Scholarships.objects.order_by('-created_at')[:3]


class NewsletterSubscribeView(APIView):
    """POST /api/v1/newsletter/subscribe/ — subscribe an email address."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = NewsletterSubscribeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': 'Thank you for subscribing to our newsletter!'},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
