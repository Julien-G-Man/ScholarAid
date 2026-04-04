"""
AI-powered scholarship assistance functions for ScholarAid.
Uses the multi-provider AI client to generate essay feedback and chat responses.
"""

import json
import logging
from typing import Optional, Dict, Any, List
from .ai_client import ai_service

logger = logging.getLogger(__name__)


def generate_essay_feedback(
    essay_text: str,
    scholarship_name: str,
    essay_prompt: Optional[str] = None,
    eligibility: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Generate structured AI feedback for an essay submission.

    Args:
        essay_text: The submitted essay
        scholarship_name: Name of the scholarship
        essay_prompt: The essay prompt/requirements
        eligibility: Scholarship eligibility requirements

    Returns:
        Dictionary with feedback structure:
        {
            'overall_score': 0-100,
            'structure_feedback': str,
            'clarity_feedback': str,
            'relevance_feedback': str,
            'persuasiveness_feedback': str,
            'grammar_feedback': str,
            'strengths': list[str],
            'improvements': list[str],
            'next_steps': str,
        }
    """
    prompt = _build_essay_feedback_prompt(
        essay_text=essay_text,
        scholarship_name=scholarship_name,
        essay_prompt=essay_prompt,
        eligibility=eligibility,
    )

    try:
        response_text = ai_service.generate_content(
            prompt=prompt,
            max_tokens=2000,
            temperature=0.7,
        )

        if not response_text:
            logger.error("AI service returned no response for essay feedback")
            return _default_essay_feedback()

        # Parse the AI response
        feedback = _parse_essay_feedback_response(response_text)
        return feedback

    except Exception as e:
        logger.error(f"Error generating essay feedback: {str(e)}")
        return _default_essay_feedback()


def generate_chat_response(
    user_message: str,
    scholarship_name: str,
    scholarship_context: Optional[str] = None,
    essay_text: Optional[str] = None,
) -> str:
    """
    Generate an AI response for a chat message.

    Args:
        user_message: The user's question
        scholarship_name: Name of the scholarship
        scholarship_context: Context about the scholarship (requirements, etc)
        essay_text: User's essay text (if available)

    Returns:
        AI-generated response text
    """
    prompt = _build_chat_prompt(
        user_message=user_message,
        scholarship_name=scholarship_name,
        scholarship_context=scholarship_context,
        essay_text=essay_text,
    )

    try:
        response_text = ai_service.generate_content(
            prompt=prompt,
            max_tokens=1000,
            temperature=0.7,
        )

        if not response_text:
            return (
                f"I understand your question about {scholarship_name}. "
                "I'm having trouble generating a response right now. "
                "Please try again in a moment."
            )

        return response_text

    except Exception as e:
        logger.error(f"Error generating chat response: {str(e)}")
        return (
            f"I apologize for the technical difficulty. "
            "I'm unable to generate a response at this moment. "
            "Please try again later."
        )


def _build_essay_feedback_prompt(
    essay_text: str,
    scholarship_name: str,
    essay_prompt: Optional[str] = None,
    eligibility: Optional[str] = None,
) -> str:
    """Build the essay feedback prompt for AI analysis."""
    prompt = f"""You are an expert scholarships advisor helping a student improve their essay for the {scholarship_name} scholarship.

Analyze the following essay and provide structured feedback:

ESSAY:
---
{essay_text[:3000]}  # Limit to first 3000 chars to stay within context
---"""

    if essay_prompt:
        prompt += f"\n\nESSAY PROMPT/REQUIREMENTS:\n{essay_prompt}"

    if eligibility:
        prompt += f"\n\nSCHOLARSHIP ELIGIBILITY:\n{eligibility}"

    prompt += """

Provide your analysis in the following JSON format:
{
    "overall_score": <0-100 integer score>,
    "structure_feedback": "<specific feedback on essay structure and organization>",
    "clarity_feedback": "<specific feedback on writing clarity and readability>",
    "relevance_feedback": "<feedback on how well the essay addresses the prompt and scholarship mission>",
    "persuasiveness_feedback": "<feedback on how compelling and convincing the essay is>",
    "grammar_feedback": "<feedback on grammar, spelling, punctuation, and style>",
    "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
    "improvements": ["<specific improvement 1>", "<specific improvement 2>", "<specific improvement 3>"],
    "next_steps": "<actionable next step the student should take to improve their application>"
}

Respond ONLY with the JSON object, no additional text or markdown formatting."""

    return prompt


def _build_chat_prompt(
    user_message: str,
    scholarship_name: str,
    scholarship_context: Optional[str] = None,
    essay_text: Optional[str] = None,
) -> str:
    """Build the chat response prompt for AI guidance."""
    prompt = f"""You are an expert scholarships advisor helping students prepare for the {scholarship_name} scholarship.

Student Question: {user_message}"""

    if scholarship_context:
        prompt += f"\n\nScholarship Information:\n{scholarship_context}"

    if essay_text:
        prompt += f"\n\nStudent's Essay (excerpt):\n{essay_text[:1000]}"

    prompt += """

Provide helpful, specific guidance based on the student's question and the scholarship details.
Be encouraging but honest about areas for improvement.
Keep your response concise but thorough (2-3 paragraphs)."""

    return prompt


def _parse_essay_feedback_response(response_text: str) -> Dict[str, Any]:
    """Parse the AI response into structured feedback."""
    try:
        # Try to extract JSON from the response
        json_str = response_text.strip()

        # If the response contains markdown code blocks, extract the JSON
        if "```json" in json_str:
            json_str = json_str.split("```json")[1].split("```")[0].strip()
        elif "```" in json_str:
            json_str = json_str.split("```")[1].split("```")[0].strip()

        feedback = json.loads(json_str)

        # Validate required fields
        required_fields = [
            'overall_score',
            'structure_feedback',
            'clarity_feedback',
            'relevance_feedback',
            'persuasiveness_feedback',
            'grammar_feedback',
            'strengths',
            'improvements',
            'next_steps',
        ]

        for field in required_fields:
            if field not in feedback:
                logger.warning(f"Missing field in essay feedback: {field}")
                return _default_essay_feedback()

        # Ensure overall_score is an integer 0-100
        feedback['overall_score'] = max(0, min(100, int(feedback['overall_score'])))

        # Ensure strengths and improvements are lists
        if not isinstance(feedback['strengths'], list):
            feedback['strengths'] = [feedback['strengths']]
        if not isinstance(feedback['improvements'], list):
            feedback['improvements'] = [feedback['improvements']]

        # Convert lists to JSON strings for database storage
        feedback['strengths'] = json.dumps(feedback['strengths'])
        feedback['improvements'] = json.dumps(feedback['improvements'])

        return feedback

    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error in essay feedback: {str(e)}")
        logger.error(f"Response text: {response_text[:500]}")
        return _default_essay_feedback()
    except Exception as e:
        logger.error(f"Error parsing essay feedback: {str(e)}")
        return _default_essay_feedback()


def _default_essay_feedback() -> Dict[str, Any]:
    """Return default feedback structure when AI generation fails."""
    return {
        'overall_score': 0,
        'structure_feedback': 'Your essay structure is clear. Consider organizing your ideas with a stronger introduction, body paragraphs with distinct themes, and a compelling conclusion.',
        'clarity_feedback': 'Your writing is generally clear. Make sure each sentence directly supports your main ideas for better impact.',
        'relevance_feedback': 'Ensure your essay directly addresses the scholarship prompt and explains why you are a strong fit for this specific scholarship.',
        'persuasiveness_feedback': 'Consider using specific examples and personal stories to make your essay more compelling. Show, don\'t just tell.',
        'grammar_feedback': 'Proofread your essay carefully for grammar, spelling, and punctuation. Consider having someone else review it for a fresh perspective.',
        'strengths': json.dumps([
            'Your enthusiasm for the scholarship mission comes through',
            'You provide relevant background information',
            'Your writing is readable and well-organized',
        ]),
        'improvements': json.dumps([
            'Add more specific examples to support your claims',
            'Strengthen your conclusion to leave a lasting impression',
            'Connect your personal goals more directly to the scholarship\'s values',
        ]),
        'next_steps': 'Review the feedback above and revise your essay, then submit it again for another round of analysis to see your improvements.',
    }
