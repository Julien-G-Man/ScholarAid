import logging

from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

from .models import UserProfile
from .serializers import RegisterSerializer, UserSerializer, UserProfileSerializer


logger = logging.getLogger('users.auth')


def _get_client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


class RegisterView(APIView):
    """POST /api/v1/auth/register/"""
    permission_classes = [AllowAny]

    def post(self, request):
        client_ip = _get_client_ip(request)
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            # Create an empty profile automatically on registration
            UserProfile.objects.create(user=user)
            refresh = RefreshToken.for_user(user)
            logger.info(
                'auth.register.success user_id=%s username=%s ip=%s',
                user.id,
                user.username,
                client_ip,
            )
            return Response(
                {
                    'user': UserSerializer(user).data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                },
                status=status.HTTP_201_CREATED,
            )
        logger.warning(
            'auth.register.failed ip=%s error_fields=%s',
            client_ip,
            list(serializer.errors.keys()),
        )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(TokenObtainPairView):
    """POST /api/v1/auth/login/"""
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        client_ip = _get_client_ip(request)
        identifier = request.data.get('username') or request.data.get('email') or '<unknown>'
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            logger.info('auth.login.success identifier=%s ip=%s', identifier, client_ip)
        else:
            logger.warning('auth.login.failed identifier=%s ip=%s', identifier, client_ip)
        return response


class LoggedTokenRefreshView(TokenRefreshView):
    """POST /api/v1/auth/token/refresh/"""

    def post(self, request, *args, **kwargs):
        client_ip = _get_client_ip(request)
        response = super().post(request, *args, **kwargs)
        if response.status_code == status.HTTP_200_OK:
            logger.info('auth.token_refresh.success ip=%s', client_ip)
        else:
            logger.warning('auth.token_refresh.failed ip=%s', client_ip)
        return response


class LogoutView(APIView):
    """POST /api/v1/auth/logout/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        client_ip = _get_client_ip(request)
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            logger.warning('auth.logout.failed_missing_refresh user_id=%s ip=%s', request.user.id, client_ip)
            return Response({'error': 'refresh token is required.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(refresh_token).blacklist()
            logger.info('auth.logout.success user_id=%s ip=%s', request.user.id, client_ip)
            return Response({'message': 'Logged out successfully.'}, status=status.HTTP_200_OK)
        except Exception:
            logger.warning('auth.logout.failed_invalid_refresh user_id=%s ip=%s', request.user.id, client_ip)
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


class ChangePasswordView(APIView):
    """POST /api/v1/auth/change-password/"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        client_ip = _get_client_ip(request)
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        new_password_2 = request.data.get('new_password_2')

        # Validate inputs
        if not all([old_password, new_password, new_password_2]):
            logger.warning('auth.change_password.failed_missing_fields user_id=%s ip=%s', request.user.id, client_ip)
            return Response(
                {'error': 'All fields are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if new_password != new_password_2:
            logger.warning('auth.change_password.failed_mismatch user_id=%s ip=%s', request.user.id, client_ip)
            return Response(
                {'error': 'New passwords do not match.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Verify old password
        if not request.user.check_password(old_password):
            logger.warning('auth.change_password.failed_bad_old_password user_id=%s ip=%s', request.user.id, client_ip)
            return Response(
                {'error': 'Old password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate new password strength (Django's default validators)
        from django.contrib.auth.password_validation import validate_password
        from django.core.exceptions import ValidationError
        try:
            validate_password(new_password, user=request.user)
        except ValidationError as e:
            logger.warning('auth.change_password.failed_validation user_id=%s ip=%s', request.user.id, client_ip)
            return Response({'error': ' '.join(e.messages)}, status=status.HTTP_400_BAD_REQUEST)

        # Set new password
        request.user.set_password(new_password)
        request.user.save()
        logger.info('auth.change_password.success user_id=%s ip=%s', request.user.id, client_ip)

        return Response(
            {'message': 'Password changed successfully.'},
            status=status.HTTP_200_OK
        )