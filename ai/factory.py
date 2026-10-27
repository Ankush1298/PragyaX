"""
AI Provider Factory
Central instantiation point for the active AI Provider.
"""

import os
from .base import BaseAIProvider
from .mock_provider import MockAIProvider
from .real_provider import RealAIProvider


def get_ai_provider() -> BaseAIProvider:
    """
    Returns the configured AI Provider based on AI_PROVIDER environment variable.
    Defaults to MockAIProvider for deterministic local development and demo testing.
    """
    provider_type = os.getenv("AI_PROVIDER", "mock").strip().lower()

    if provider_type in ("openai", "gemini", "real"):
        return RealAIProvider(provider_type=provider_type)

    return MockAIProvider()
