from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import UserProfile
from .serializers import RegisterSerializer, UserSerializer, UserProfileSerializer


class RegisterView(APIView):
    """POST /api/v1/auth/register/"""
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Create an empty profile automatically on registration
            UserProfile.objects.create(user=user)
            refresh = RefreshToken.for_user(user)
            return Response(
                {
                    'user': UserSerializer(user).data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/"""
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """POST /api/v1/auth/logout/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'error': 'refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            return Response({'error': 'Invalid or already-expired token.'}, status=status.HTTP_400_BAD_REQUEST)


class ProfileView(APIView):
    """GET/PATCH /api/v1/auth/profile/"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        # Split user-level and profile-level fields
        user_fields = {k: v for k, v in request.data.items()
                       if k in ('first_name', 'last_name', 'email')}
        profile_fields = {k: v for k, v in request.data.items()
                          if k in ('bio', 'institution', 'field_of_study', 'country')}

        if user_fields:
            user_serializer = UserSerializer(request.user, data=user_fields, partial=True)
            if not user_serializer.is_valid():
                return Response(user_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            user_serializer.save()

        if profile_fields:
            profile, _ = UserProfile.objects.get_or_create(user=request.user)
            profile_serializer = UserProfileSerializer(profile, data=profile_fields, partial=True)
            if not profile_serializer.is_valid():
                return Response(profile_serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            profile_serializer.save()

        return Response(UserSerializer(request.user).data)
