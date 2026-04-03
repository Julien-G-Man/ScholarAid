from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from api.serializers import AIReviewSubmitSerializer


class AIReviewView(APIView):
    """POST /api/v1/ai-review/<scholarship_id>/ — submit essay for AI review."""
    permission_classes = [AllowAny]

    def post(self, request, scholarship_id):
        serializer = AIReviewSubmitSerializer(data=request.data)
        if serializer.is_valid():
            # AI review logic will be implemented here
            return Response(
                {
                    'scholarship_id': scholarship_id,
                    'message': 'Essay received. AI review is being processed.',
                    'feedback': None,
                },
                status=status.HTTP_202_ACCEPTED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
