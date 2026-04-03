from rest_framework import serializers


class AIReviewSubmitSerializer(serializers.Serializer):
    essay_text = serializers.CharField(required=False, allow_blank=True)
    essay_file = serializers.FileField(required=False)

    def validate(self, attrs):
        if not attrs.get('essay_text') and not attrs.get('essay_file'):
            raise serializers.ValidationError('Provide either essay_text or essay_file.')
        return attrs
