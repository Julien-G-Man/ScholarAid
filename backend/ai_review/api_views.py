from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView

from core.models import Scholarships
from .models import ApplicationGuide, AIReviewSession, EssayFeedback, ChatMessage
from .serializers import (
    ApplicationGuideSerializer,
    AIReviewSessionSerializer,
    EssayFeedbackSerializer,
    ChatMessageSerializer,
    EssaySubmitSerializer,
    ChatSubmitSerializer,
)
from utils.scholarship_ai import generate_essay_feedback, generate_chat_response


class AIPreparationGuideView(APIView):
    """GET /api/v1/ai-prep/{scholarship_id}/

    Returns all preparation guides for a scholarship.
    Includes overview, requirements, essay tips, common mistakes, standing out strategies.
    """
    permission_classes = [AllowAny]

    def get(self, request, scholarship_id):
        try:
            scholarship = Scholarships.objects.get(pk=scholarship_id)
        except Scholarships.DoesNotExist:
            return Response(
                {'error': 'Scholarship not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        guides = ApplicationGuide.objects.filter(scholarship=scholarship)
        serializer = ApplicationGuideSerializer(guides, many=True)
        return Response({
            'scholarship': scholarship.name,
            'guides': serializer.data,
        })


class AIReviewSessionListView(ListAPIView):
    """GET /api/v1/ai-prep/reviews/

    List all review sessions for the authenticated user.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AIReviewSessionSerializer
    pagination_class = None

    def get_queryset(self):
        return AIReviewSession.objects.filter(user=self.request.user).prefetch_related('feedback', 'chat_messages')


class AIReviewSessionDetailView(RetrieveAPIView):
    """GET /api/v1/ai-review/{session_id}/

    Retrieve a specific review session with full feedback and chat.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = AIReviewSessionSerializer

    def get_queryset(self):
        return AIReviewSession.objects.filter(user=self.request.user).prefetch_related('feedback', 'chat_messages')

    def get_object(self):
        session_id = self.kwargs.get('session_id')
        try:
            return AIReviewSession.objects.get(pk=session_id, user=self.request.user)
        except AIReviewSession.DoesNotExist:
            self.permission_denied(self.request)


class AIReviewSubmitView(APIView):
    """POST /api/v1/ai-review/

    Submit an essay for AI review.
    Accepts:
    - scholarship_id (required)
    - essay_text OR essay_file (one required)

    Returns a review session ID.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        scholarship_id = request.data.get('scholarship_id')

        if not scholarship_id:
            return Response(
                {'error': 'scholarship_id is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            scholarship = Scholarships.objects.get(pk=scholarship_id)
        except Scholarships.DoesNotExist:
            return Response(
                {'error': 'Scholarship not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Validate essay submission
        serializer = EssaySubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Get or create session
        session, created = AIReviewSession.objects.get_or_create(
            user=request.user,
            scholarship=scholarship,
            defaults={'status': 'submitted'}
        )

        if not created:
            session.status = 'submitted'
            session.save()

        # Handle essay file upload
        essay_text = serializer.validated_data.get('essay_text', '')
        essay_file = serializer.validated_data.get('essay_file')
        essay_file_name = ''

        if essay_file:
            # Extract text from file (placeholder — implement proper file parsing later)
            essay_text = f"[File uploaded: {essay_file.name}]\n" + essay_text
            essay_file_name = essay_file.name

        # Generate AI feedback
        ai_feedback = generate_essay_feedback(
            essay_text=essay_text,
            scholarship_name=scholarship.name,
            essay_prompt=scholarship.essay_prompt,
            eligibility=scholarship.eligibility,
        )

        # Create or update feedback record
        feedback, _ = EssayFeedback.objects.get_or_create(session=session)
        feedback.essay_text = essay_text
        feedback.essay_file_name = essay_file_name
        feedback.overall_score = ai_feedback.get('overall_score', 0)
        feedback.structure_feedback = ai_feedback.get('structure_feedback', '')
        feedback.clarity_feedback = ai_feedback.get('clarity_feedback', '')
        feedback.relevance_feedback = ai_feedback.get('relevance_feedback', '')
        feedback.persuasiveness_feedback = ai_feedback.get('persuasiveness_feedback', '')
        feedback.grammar_feedback = ai_feedback.get('grammar_feedback', '')
        feedback.strengths = ai_feedback.get('strengths', '[]')
        feedback.improvements = ai_feedback.get('improvements', '[]')
        feedback.next_steps = ai_feedback.get('next_steps', '')
        feedback.save()

        session.status = 'reviewed'
        session.save()

        return Response(
            AIReviewSessionSerializer(session).data,
            status=status.HTTP_201_CREATED
        )


class AIChatView(APIView):
    """POST /api/v1/ai-review/{session_id}/chat/

    Send a message to the AI guide for a specific review session.
    Get live guidance on scholarship preparation.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, session_id):
        try:
            session = AIReviewSession.objects.get(pk=session_id, user=request.user)
        except AIReviewSession.DoesNotExist:
            return Response(
                {'error': 'Session not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = ChatSubmitSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user_message = serializer.validated_data['message']

        # Store user message
        user_msg = ChatMessage.objects.create(
            session=session,
            role='user',
            content=user_message
        )

        # Generate AI response (placeholder — will integrate with Claude API)
        ai_response_text = self._generate_ai_response(session, user_message)

        ai_msg = ChatMessage.objects.create(
            session=session,
            role='ai',
            content=ai_response_text
        )

        # Return both messages
        messages = ChatMessage.objects.filter(session=session)
        return Response({
            'session_id': session.id,
            'messages': ChatMessageSerializer(messages, many=True).data,
        }, status=status.HTTP_201_CREATED)

    def get(self, request, session_id):
        """GET /api/v1/ai-review/{session_id}/chat/

        Retrieve all chat messages for a review session.
        """
        try:
            session = AIReviewSession.objects.get(pk=session_id, user=request.user)
        except AIReviewSession.DoesNotExist:
            return Response(
                {'error': 'Session not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        messages = ChatMessage.objects.filter(session=session)
        return Response({
            'session_id': session.id,
            'scholarship': session.scholarship.name,
            'messages': ChatMessageSerializer(messages, many=True).data,
        })

    def _generate_ai_response(self, session, user_message):
        """Generate AI response using multi-provider client."""
        scholarship_context = None
        essay_text = None

        # Gather scholarship context
        if session.scholarship:
            context_parts = []
            if session.scholarship.eligibility:
                context_parts.append(f"Eligibility: {session.scholarship.eligibility}")
            if session.scholarship.essay_prompt:
                context_parts.append(f"Essay Prompt: {session.scholarship.essay_prompt}")
            scholarship_context = "\n".join(context_parts) if context_parts else None

        # Gather essay context if feedback exists
        if session.feedback and session.feedback.essay_text:
            essay_text = session.feedback.essay_text[:1000]  # First 1000 chars

        response = generate_chat_response(
            user_message=user_message,
            scholarship_name=session.scholarship.name,
            scholarship_context=scholarship_context,
            essay_text=essay_text,
        )
        return response


class AIReviewViewOld(APIView):
    """Legacy endpoint — kept for backwards compatibility.
    POST /api/v1/ai-review/{scholarship_id}/

    DEPRECATED: Use /api/v1/ai-review/ (POST) instead.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, scholarship_id):
        return Response(
            {
                'message': 'This endpoint is deprecated. Use POST /api/v1/ai-review/ instead.',
                'new_endpoint': '/api/v1/ai-review/',
            },
            status=status.HTTP_301_MOVED_PERMANENTLY
        )
