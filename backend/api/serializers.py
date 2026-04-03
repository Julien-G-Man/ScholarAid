from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from core.models import Scholarships, NewsletterSubscription


class ScholarshipSerializer(serializers.ModelSerializer):
    deadline = serializers.DateField(format='%Y-%m-%d', allow_null=True)

    class Meta:
        model = Scholarships
        fields = [
            'id', 'name', 'provider', 'institution', 'level',
            'description', 'eligibility', 'essay_prompt',
            'deadline', 'link', 'logo_url', 'created_at',
        ]


class NewsletterSubscribeSerializer(serializers.ModelSerializer):
    class Meta:
        model = NewsletterSubscription
        fields = ['email']

    def validate_email(self, value):
        if NewsletterSubscription.objects.filter(email=value).exists():
            raise serializers.ValidationError('This email is already subscribed.')
        return value


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label='Confirm password')

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password2']

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')
        return User.objects.create_user(**validated_data)


class AIReviewSubmitSerializer(serializers.Serializer):
    essay_text = serializers.CharField(required=False, allow_blank=True)
    essay_file = serializers.FileField(required=False)

    def validate(self, attrs):
        if not attrs.get('essay_text') and not attrs.get('essay_file'):
            raise serializers.ValidationError('Provide either essay_text or essay_file.')
        return attrs
