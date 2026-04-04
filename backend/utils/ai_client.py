"""
Multi-provider AI client for ScholarAid.
Supports Claude, NVIDIA DeepSeek, NVIDIA OpenAI, Azure, DeepSeek, Gemini, HuggingFace, and Cohere.
With configurable priority order and fallback logic.
"""

import os
import json
import logging
from typing import Optional, Dict, Any, List
import httpx

logger = logging.getLogger(__name__)


class AIClient:
    """Multi-provider AI orchestration client with fallback support."""

    def __init__(self):
        """Initialize the AI client with configured providers and priorities."""
        self.provider_list = [
            'claude',
            'nvidia_deepseek',
            'nvidia_openai',
            'azure',
            'deepseek',
            'gemini',
            'huggingface',
            'cohere',
        ]
        self._refresh_keys()

    def _refresh_keys(self):
        """Load API keys from environment variables."""
        self.api_keys = {
            'claude': os.getenv('CLAUDE_API_KEY', ''),
            'nvidia_deepseek': os.getenv('NVIDIA_DEEPSEEK_API_KEY', ''),
            'nvidia_openai': os.getenv('NVIDIA_OPENAI_API_KEY', ''),
            'azure': os.getenv('AZURE_OPENAI_API_KEY', ''),
            'azure_endpoint': os.getenv('AZURE_OPENAI_ENDPOINT', ''),
            'deepseek': os.getenv('DEEPSEEK_API_KEY', ''),
            'gemini': os.getenv('GEMINI_API_KEY', ''),
            'huggingface': os.getenv('HUGGINGFACE_API_KEY', ''),
            'cohere': os.getenv('COHERE_API_KEY', ''),
        }
        logger.info("API keys refreshed from environment variables")

    def generate_content(
        self,
        prompt: str,
        max_tokens: int = 1500,
        temperature: float = 0.7,
    ) -> Optional[str]:
        """
        Generate content using configured providers in priority order.
        Falls back to next provider if current one fails.

        Args:
            prompt: The input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0-1)

        Returns:
            Generated content or None if all providers fail
        """
        for provider in self.provider_list:
            try:
                logger.info(f"Attempting to generate content with {provider}")

                if provider == 'claude':
                    response = self._call_claude(prompt, max_tokens, temperature)
                elif provider == 'nvidia_deepseek':
                    response = self._call_nvidia_deepseek(prompt, max_tokens, temperature)
                elif provider == 'nvidia_openai':
                    response = self._call_nvidia_openai(prompt, max_tokens, temperature)
                elif provider == 'azure':
                    response = self._call_azure(prompt, max_tokens, temperature)
                elif provider == 'deepseek':
                    response = self._call_deepseek(prompt, max_tokens, temperature)
                elif provider == 'gemini':
                    response = self._call_gemini(prompt, max_tokens, temperature)
                elif provider == 'huggingface':
                    response = self._call_huggingface(prompt, max_tokens, temperature)
                elif provider == 'cohere':
                    response = self._call_cohere(prompt, max_tokens, temperature)
                else:
                    continue

                if response:
                    logger.info(f"Successfully generated content with {provider}")
                    return response

            except Exception as e:
                logger.warning(f"Provider {provider} failed: {str(e)}")
                continue

        logger.error("All AI providers failed to generate content")
        return None

    def _call_claude(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> Optional[str]:
        """Call Anthropic Claude API."""
        if not self.api_keys['claude']:
            return None

        try:
            import anthropic
            client = anthropic.Anthropic(api_key=self.api_keys['claude'])
            message = client.messages.create(
                model="claude-opus-4-6",
                max_tokens=max_tokens,
                temperature=temperature,
                messages=[{"role": "user", "content": prompt}],
            )
            return message.content[0].text
        except ImportError:
            logger.error("anthropic package not installed")
            return None
        except Exception as e:
            logger.error(f"Claude API error: {str(e)}")
            return None

    def _call_nvidia_deepseek(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> Optional[str]:
        """Call NVIDIA DeepSeek endpoint."""
        if not self.api_keys['nvidia_deepseek']:
            return None

        try:
            url = "https://integrate.api.nvidia.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_keys['nvidia_deepseek']}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "deepseek-ai/deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            with httpx.Client() as client:
                response = client.post(url, json=payload, headers=headers, timeout=30)
                response.raise_for_status()
                data = response.json()
                return data['choices'][0]['message']['content']
        except Exception as e:
            logger.error(f"NVIDIA DeepSeek API error: {str(e)}")
            return None

    def _call_nvidia_openai(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> Optional[str]:
        """Call NVIDIA OpenAI endpoint."""
        if not self.api_keys['nvidia_openai']:
            return None

        try:
            url = "https://integrate.api.nvidia.com/v1/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_keys['nvidia_openai']}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "nvidia/llama-3.1-405b-instruct",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            with httpx.Client() as client:
                response = client.post(url, json=payload, headers=headers, timeout=30)
                response.raise_for_status()
                data = response.json()
                return data['choices'][0]['message']['content']
        except Exception as e:
            logger.error(f"NVIDIA OpenAI API error: {str(e)}")
            return None

    def _call_azure(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> Optional[str]:
        """Call Azure OpenAI API."""
        if not self.api_keys['azure'] or not self.api_keys['azure_endpoint']:
            return None

        try:
            from openai import AzureOpenAI
            client = AzureOpenAI(
                api_key=self.api_keys['azure'],
                api_version="2024-02-15-preview",
                azure_endpoint=self.api_keys['azure_endpoint'],
            )
            response = client.chat.completions.create(
                model="gpt-4",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.choices[0].message.content
        except ImportError:
            logger.error("openai package not installed")
            return None
        except Exception as e:
            logger.error(f"Azure OpenAI API error: {str(e)}")
            return None

    def _call_deepseek(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> Optional[str]:
        """Call DeepSeek API directly."""
        if not self.api_keys['deepseek']:
            return None

        try:
            url = "https://api.deepseek.com/chat/completions"
            headers = {
                "Authorization": f"Bearer {self.api_keys['deepseek']}",
                "Content-Type": "application/json",
            }
            payload = {
                "model": "deepseek-chat",
                "messages": [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

            with httpx.Client() as client:
                response = client.post(url, json=payload, headers=headers, timeout=30)
                response.raise_for_status()
                data = response.json()
                return data['choices'][0]['message']['content']
        except Exception as e:
            logger.error(f"DeepSeek API error: {str(e)}")
            return None

    def _call_gemini(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> Optional[str]:
        """Call Google Gemini API."""
        if not self.api_keys['gemini']:
            return None

        try:
            import google.generativeai as genai
            genai.configure(api_key=self.api_keys['gemini'])
            model = genai.GenerativeModel('gemini-pro')
            response = model.generate_content(
                prompt,
                generation_config={
                    'max_output_tokens': max_tokens,
                    'temperature': temperature,
                },
            )
            return response.text
        except ImportError:
            logger.error("google-generativeai package not installed")
            return None
        except Exception as e:
            logger.error(f"Gemini API error: {str(e)}")
            return None

    def _call_huggingface(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> Optional[str]:
        """Call HuggingFace Inference API."""
        if not self.api_keys['huggingface']:
            return None

        try:
            url = "https://api-inference.huggingface.co/models/meta-llama/Llama-2-70b-chat-hf"
            headers = {"Authorization": f"Bearer {self.api_keys['huggingface']}"}
            payload = {
                "inputs": prompt,
                "parameters": {
                    "max_new_tokens": max_tokens,
                    "temperature": temperature,
                },
            }

            with httpx.Client() as client:
                response = client.post(url, json=payload, headers=headers, timeout=30)
                response.raise_for_status()
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    return data[0].get('generated_text', '')
                return None
        except Exception as e:
            logger.error(f"HuggingFace API error: {str(e)}")
            return None

    def _call_cohere(
        self, prompt: str, max_tokens: int, temperature: float
    ) -> Optional[str]:
        """Call Cohere API."""
        if not self.api_keys['cohere']:
            return None

        try:
            import cohere
            client = cohere.ClientV2(api_key=self.api_keys['cohere'])
            response = client.chat(
                model="command-r-plus",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=max_tokens,
                temperature=temperature,
            )
            return response.message.content[0].text
        except ImportError:
            logger.error("cohere package not installed")
            return None
        except Exception as e:
            logger.error(f"Cohere API error: {str(e)}")
            return None


# Global singleton instance
ai_service = AIClient()
