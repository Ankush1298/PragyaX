"""
Live AI Provider Integration Scaffold
Owned by: Ekansh (AI/ML Evaluation)
Supports optional integration with OpenAI / Google Gemini with graceful fallback.
"""

import os
from typing import List, Dict, Any
from .base import BaseAIProvider
from .mock_provider import MockAIProvider


class RealAIProvider(BaseAIProvider):
    """
    Live AI Provider wrapper.
    If live API keys are not supplied or fails, falls back gracefully to deterministic MockAIProvider.
    """

    def __init__(self, provider_type: str = "openai"):
        self._provider_type = provider_type.lower()
        self._api_key = os.getenv("OPENAI_API_KEY") if self._provider_type == "openai" else os.getenv("GEMINI_API_KEY")
        self._fallback = MockAIProvider()

    @property
    def provider_name(self) -> str:
        # Live calls are not implemented yet, so never claim to be a live model.
        return f"{self._provider_type.upper()} scaffold (not implemented, using {self._fallback.provider_name})"

    @property
    def is_mock(self) -> bool:
        # Ekansh: return `not self._has_valid_credentials()` once the live calls below are implemented.
        return True

    def _has_valid_credentials(self) -> bool:
        return bool(self._api_key and len(self._api_key.strip()) > 10)

    def generate_chat_response(
        self, prompt: str, subject: str = "Python Programming", history: List[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        # Ekansh can integrate live SDK calls here (e.g. google.genai or openai)
        # Without credentials, it falls back to the deterministic mock provider
        return self._fallback.generate_chat_response(prompt, subject, history)

    def evaluate_assessment(
        self,
        subject: str,
        questions: List[Dict[str, Any]],
        user_answers: Dict[str, str],
    ) -> Dict[str, Any]:
        # Ekansh can integrate live rubric prompting here
        # Without credentials, it evaluates via deterministic mock rubric
        return self._fallback.evaluate_assessment(subject, questions, user_answers)
