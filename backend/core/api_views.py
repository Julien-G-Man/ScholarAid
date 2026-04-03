from django.db.models import Q
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Scholarships, NewsletterSubscription, ContactMessage
from .serializers import ScholarshipSerializer, NewsletterSubscribeSerializer, ContactSerializer


class ScholarshipListView(generics.ListAPIView):
    """GET /api/v1/scholarships/
    Paginated list of all scholarships.
    Accepts optional query params:
      ?search=<str>  — searches name, description, provider, institution
      ?level=<str>   — filters by level (case-insensitive contains)
    """
    serializer_class = ScholarshipSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = Scholarships.objects.all().order_by('-created_at')
        search = self.request.query_params.get('search', '').strip()
        level = self.request.query_params.get('level', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(provider__icontains=search)
                | Q(institution__icontains=search)
            )
        if level:
            qs = qs.filter(level__icontains=level)
        return qs


class ScholarshipDetailView(generics.RetrieveAPIView):
    """GET /api/v1/scholarships/<pk>/"""
    queryset = Scholarships.objects.all()
    serializer_class = ScholarshipSerializer
    permission_classes = [AllowAny]


class FeaturedScholarshipsView(generics.ListAPIView):
    """GET /api/v1/scholarships/featured/ — 3 most-recent scholarships for the homepage."""
    serializer_class = ScholarshipSerializer
    permission_classes = [AllowAny]
    pagination_class = None

    def get_queryset(self):
        return Scholarships.objects.order_by('-created_at', '-id')[:3]


class NewsletterSubscribeView(APIView):
    """POST /api/v1/newsletter/subscribe/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = NewsletterSubscribeSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Thank you for subscribing!'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ContactView(APIView):
    """POST /api/v1/contact/ — store a contact form submission."""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ContactSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {'message': "Thanks for reaching out! We'll get back to you soon."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
