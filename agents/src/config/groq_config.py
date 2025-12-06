"""Groq LLM configuration and client setup."""

from langchain_groq import ChatGroq
from langchain_core.language_models import BaseChatModel
from .settings import settings


def get_groq_llm(model_name: str = "llama-3.1-70b-versatile", temperature: float = 0.1) -> BaseChatModel:
    """
    Get a configured Groq LLM instance.

    Args:
        model_name: The Groq model to use (default: llama-3.1-70b-versatile)
        temperature: Temperature for generation (default: 0.1 for deterministic reasoning)

    Returns:
        Configured ChatGroq instance
    """
    return ChatGroq(
        groq_api_key=settings.groq_api_key,
        model_name=model_name,
        temperature=temperature,
    )

