from rest_framework import serializers
from .models import Scholarships, NewsletterSubscription, ContactMessage


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


class ContactSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ['name', 'email', 'subject', 'message']
