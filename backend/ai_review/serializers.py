from rest_framework import serializers
from .models import ApplicationGuide, AIReviewSession, EssayFeedback, ChatMessage


class ApplicationGuideSerializer(serializers.ModelSerializer):
    """Serialize scholarship preparation guidance."""
    class Meta:
        model = ApplicationGuide
        fields = ['id', 'scholarship', 'category', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']


class ChatMessageSerializer(serializers.ModelSerializer):
    """Serialize chat messages in Q&A sessions."""
    class Meta:
        model = ChatMessage
        fields = ['id', 'role', 'content', 'created_at']
        read_only_fields = ['id', 'created_at']


class EssayFeedbackSerializer(serializers.ModelSerializer):
    """Serialize detailed essay feedback."""
    class Meta:
        model = EssayFeedback
        fields = [
            'id', 'overall_score', 'structure_feedback', 'clarity_feedback',
            'relevance_feedback', 'persuasiveness_feedback', 'grammar_feedback',
            'strengths', 'improvements', 'next_steps', 'reviewed_at'
        ]
        read_only_fields = ['id', 'reviewed_at']


class AIReviewSessionSerializer(serializers.ModelSerializer):
    """Serialize AI review sessions with nested feedback and chat."""
    feedback = EssayFeedbackSerializer(read_only=True)
    chat_messages = ChatMessageSerializer(many=True, read_only=True)

    class Meta:
        model = AIReviewSession
        fields = ['id', 'scholarship', 'status', 'notes', 'feedback', 'chat_messages', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class EssaySubmitSerializer(serializers.Serializer):
    """Handle essay submission for review (text or file)."""
    ALLOWED_EXTENSIONS = {'pdf', 'doc', 'docx', 'txt'}
    MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
    MAX_TEXT_LENGTH = 50_000          # ~10 pages of text

    essay_text = serializers.CharField(required=False, allow_blank=True, max_length=MAX_TEXT_LENGTH)
    essay_file = serializers.FileField(required=False)

    def validate_essay_file(self, file):
        ext = file.name.rsplit('.', 1)[-1].lower() if '.' in file.name else ''
        if ext not in self.ALLOWED_EXTENSIONS:
            raise serializers.ValidationError(
                f'Unsupported file type ".{ext}". Allowed: {", ".join(self.ALLOWED_EXTENSIONS)}.'
            )
        if file.size > self.MAX_FILE_SIZE:
            raise serializers.ValidationError('File too large. Maximum size is 5 MB.')
        return file

    def validate(self, attrs):
        if not attrs.get('essay_text') and not attrs.get('essay_file'):
            raise serializers.ValidationError('Provide either essay_text or essay_file.')
        return attrs


class ChatSubmitSerializer(serializers.Serializer):
    """Handle user question submission in AI chat."""
    message = serializers.CharField(required=True, min_length=5, max_length=2000)
