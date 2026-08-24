"""
LLM provider abstraction.

ClaimAssist AI never lets an LLM invent policy sections, clinical facts,
or citations. This module's job is narrow and mechanical: turn a
pre-assembled, evidence-grounded prompt into text. It does not decide
*what* evidence exists — that is the job of ClinicalEvidenceExtractor,
RAGEngine, and RequirementMatcher, all of which run before this is ever
called.

Three backends are supported:
  - "gemini": calls the Google Gemini API if LLM_API_KEY is set.
  - "anthropic": calls the real Claude API if LLM_API_KEY is set.
  - "mock": deterministic template-based generation, used when no API key
    is configured, so the demo always works end-to-end offline.

Swap providers by changing LLM_PROVIDER in the environment — nothing else
in the codebase needs to change (build_appeal_draft in appeal_generator.py
is the only integration point, via get_llm_provider().complete(...)).
"""

import os
import logging

logger = logging.getLogger("claimassist.llm")

PROVIDER = os.getenv("LLM_PROVIDER", "mock").lower()
LLM_API_KEY = os.getenv("LLM_API_KEY") or os.getenv("GEMINI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")
LLM_MODEL = os.getenv("LLM_MODEL")  # optional override; each provider has a sensible default


class LLMProvider:
    """Abstract interface every provider implements."""

    def complete(self, system_prompt: str, user_prompt: str, max_tokens: int = 1600) -> str:
        raise NotImplementedError


class MockLLMProvider(LLMProvider):
    """
    Deterministic, template-based "generation" used when no LLM API key is
    configured. It never invents facts: the caller (AppealGenerator) is
    responsible for passing in only verified evidence, and this provider
    just formats it into prose using fixed templates.
    """

    def complete(self, system_prompt: str, user_prompt: str, max_tokens: int = 1600) -> str:
        logger.info("MockLLMProvider.complete called (no live LLM configured)")
        return user_prompt  # AppealGenerator builds the full templated letter itself


class GeminiLLMProvider(LLMProvider):
    """
    Google Gemini backend, via the `google-genai` SDK. The pre-grounded
    draft letter (built in appeal_generator.py) is passed as the user
    prompt; Gemini is only asked to polish grammar/tone/phrasing under a
    system instruction that forbids adding any new fact or citation.
    """

    def __init__(self, api_key: str, model: str = "gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model

    def complete(self, system_prompt: str, user_prompt: str, max_tokens: int = 1600) -> str:
        try:
            from google import genai
            from google.genai import types
        except ImportError as exc:
            raise RuntimeError(
                "The 'google-genai' package is not installed. Run "
                "`pip install google-genai` or set LLM_PROVIDER=mock."
            ) from exc

        client = genai.Client(api_key=self.api_key)
        try:
            response = client.models.generate_content(
                model=self.model,
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    max_output_tokens=max_tokens,
                    temperature=0.2,
                ),
            )
        except Exception as exc:
            raise RuntimeError(f"Gemini API request failed: {exc}") from exc

        text = getattr(response, "text", None)
        if not text:
            raise RuntimeError("Gemini API returned an empty response.")
        return text.strip()


class AnthropicLLMProvider(LLMProvider):
    def __init__(self, api_key: str, model: str = "claude-sonnet-4-6"):
        self.api_key = api_key
        self.model = model

    def complete(self, system_prompt: str, user_prompt: str, max_tokens: int = 1600) -> str:
        try:
            import anthropic
        except ImportError as exc:
            raise RuntimeError(
                "The 'anthropic' package is not installed. Run "
                "`pip install anthropic` or set LLM_PROVIDER=mock."
            ) from exc

        client = anthropic.Anthropic(api_key=self.api_key)
        response = client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            system=system_prompt,
            messages=[{"role": "user", "content": user_prompt}],
        )
        parts = [block.text for block in response.content if getattr(block, "type", None) == "text"]
        return "\n".join(parts).strip()


def get_llm_provider() -> LLMProvider:
    if PROVIDER == "gemini":
        if LLM_API_KEY:
            return GeminiLLMProvider(LLM_API_KEY, LLM_MODEL or "gemini-2.5-flash")
        logger.warning("LLM_PROVIDER=gemini but no LLM_API_KEY set; falling back to mock provider")
        return MockLLMProvider()

    if PROVIDER == "anthropic":
        if LLM_API_KEY:
            return AnthropicLLMProvider(LLM_API_KEY, LLM_MODEL or "claude-sonnet-4-6")
        logger.warning("LLM_PROVIDER=anthropic but no LLM_API_KEY set; falling back to mock provider")
        return MockLLMProvider()

    return MockLLMProvider()
