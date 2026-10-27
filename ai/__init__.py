"""
PragyaX AI Module
Owned by: Ekansh (AI/ML Evaluation)
Scaffolded for pluggable AI provider architecture (Mock / Gemini / OpenAI).
"""

from .base import BaseAIProvider
from .factory import get_ai_provider

__all__ = ["BaseAIProvider", "get_ai_provider"]
