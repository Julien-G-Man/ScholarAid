from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import AIReviewSubmitSerializer


class AIReviewView(APIView):
    """POST /api/v1/ai-review/<scholarship_id>/ — submit an essay for AI review.

    Accepts either a plaintext essay body or an uploaded file (PDF, DOCX, TXT, MD).
    The actual AI processing will be wired in here once the model is ready.
    """
    permission_classes = [AllowAny]

    def post(self, request, scholarship_id):
        serializer = AIReviewSubmitSerializer(data=request.data)
        if serializer.is_valid():
            # TODO: pass essay content to AI model and return real feedback
            return Response(
                {
                    'scholarship_id': scholarship_id,
                    'message': 'Essay received. AI review is being processed.',
                    'feedback': None,
                },
                status=status.HTTP_202_ACCEPTED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
