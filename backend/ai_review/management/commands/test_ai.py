"""
Management command to test AI integration.

Usage:
    python manage.py test_ai --test-feedback
    python manage.py test_ai --test-chat
    python manage.py test_ai --test-all
"""

from django.core.management.base import BaseCommand, CommandError
from utils.ai_client import ai_service
from utils.scholarship_ai import generate_essay_feedback, generate_chat_response


class Command(BaseCommand):
    help = 'Test the AI provider integration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--test-feedback',
            action='store_true',
            help='Test essay feedback generation',
        )
        parser.add_argument(
            '--test-chat',
            action='store_true',
            help='Test chat response generation',
        )
        parser.add_argument(
            '--test-raw',
            action='store_true',
            help='Test raw AI client generation',
        )
        parser.add_argument(
            '--test-all',
            action='store_true',
            help='Run all tests',
        )

    def handle(self, *args, **options):
        if not any(options.values()):
            self.test_raw_client()
            return

        if options['test_raw'] or options['test_all']:
            self.test_raw_client()

        if options['test_feedback'] or options['test_all']:
            self.test_essay_feedback()

        if options['test_chat'] or options['test_all']:
            self.test_chat_response()

        self.stdout.write(self.style.SUCCESS('\nAll tests completed!'))

    def test_raw_client(self):
        """Test the raw AI client."""
        self.stdout.write(self.style.HTTP_INFO('\n=== Testing Raw AI Client ==='))

        prompt = "What are three key elements of a strong scholarship essay?"
        self.stdout.write(f"Prompt: {prompt}\n")

        response = ai_service.generate_content(prompt=prompt, max_tokens=500)

        if response:
            self.stdout.write(self.style.SUCCESS('Response:'))
            self.stdout.write(response)
        else:
            self.stdout.write(self.style.ERROR('Failed to get response from any provider'))

    def test_essay_feedback(self):
        """Test essay feedback generation."""
        self.stdout.write(self.style.HTTP_INFO('\n=== Testing Essay Feedback ==='))

        essay = """
        Perseverance has been the cornerstone of my academic journey. Growing up in a low-income
        household, I faced numerous obstacles that could have deterred me from pursuing higher education.
        However, I refused to let circumstances define my future.

        In high school, I worked part-time while maintaining a 3.8 GPA. I started a peer tutoring program
        that helped over 50 students improve their grades. This experience taught me not just about academics,
        but about the power of lifting others up while striving for excellence.

        I am committed to using my education to make a tangible impact in my community.
        """

        self.stdout.write("Essay: [Sample essay provided]")

        feedback = generate_essay_feedback(
            essay_text=essay,
            scholarship_name="Merit Excellence Scholarship",
            essay_prompt="Describe a personal challenge and how you overcame it.",
            eligibility="GPA 3.5+, US citizen"
        )

        if feedback:
            self.stdout.write(self.style.SUCCESS('Feedback Generated:'))
            self.stdout.write(f"  Overall Score: {feedback.get('overall_score', 'N/A')}/100")
            self.stdout.write(f"  Structure: {feedback.get('structure_feedback', 'N/A')[:100]}...")
            self.stdout.write(f"  Clarity: {feedback.get('clarity_feedback', 'N/A')[:100]}...")
            self.stdout.write(f"  Next Steps: {feedback.get('next_steps', 'N/A')[:100]}...")
        else:
            self.stdout.write(self.style.ERROR('Failed to generate feedback'))

    def test_chat_response(self):
        """Test chat response generation."""
        self.stdout.write(self.style.HTTP_INFO('\n=== Testing Chat Response ==='))

        message = "How should I structure my essay introduction?"

        self.stdout.write(f"User Message: {message}\n")

        response = generate_chat_response(
            user_message=message,
            scholarship_name="Excellence Scholarship",
            scholarship_context="Scholarship focuses on leadership and academic achievement. "
                               "Essay prompt: Describe how you've demonstrated leadership.",
        )

        if response:
            self.stdout.write(self.style.SUCCESS('AI Response:'))
            self.stdout.write(response)
        else:
            self.stdout.write(self.style.ERROR('Failed to get response from any provider'))
