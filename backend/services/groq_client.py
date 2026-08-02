import json
import logging
import re
from typing import Any

from groq import Groq

logger = logging.getLogger(__name__)

from config.settings import settings


class GroqAnalysisError(RuntimeError):
    pass


class GroqClient:
    def __init__(self) -> None:
        self._client: Groq | None = None

    @property
    def client(self) -> Groq:
        if not settings.groq_api_key:
            raise GroqAnalysisError("GROQ_API_KEY is not configured.")
        if self._client is None:
            self._client = Groq(api_key=settings.groq_api_key, timeout=20.0)
        return self._client

    def complete_text(self, system_prompt: str, user_content: str, json_mode: bool = False) -> str:
        try:
            kwargs: dict[str, Any] = {}
            if json_mode:
                kwargs["response_format"] = {"type": "json_object"}
            
            response = self.client.chat.completions.create(
                model=settings.groq_model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_content},
                ],
                temperature=0.1,
                max_tokens=700,
                **kwargs
            )
            content = response.choices[0].message.content
        except Exception as exc:  # external SDK/network failures fall back safely upstream
            raise GroqAnalysisError(str(exc)) from exc

        if not content or not content.strip():
            raise GroqAnalysisError("Groq returned an empty response.")
        return content.strip()

    def complete_json(self, system_prompt: str, user_content: str) -> dict[str, Any]:
        text = self.complete_text(system_prompt, user_content, json_mode=True)
        return parse_json_object(text)

    def complete_json_raw(self, user_prompt: str) -> dict[str, Any]:
        """Complete a single self-contained prompt and parse the result as JSON."""
        text = self.complete_text(
            "You are a data extraction assistant. Follow the instructions in the user message exactly and return ONLY a valid JSON object. Do not include markdown, explanations, or python code.",
            user_prompt,
            json_mode=True,
        )
        return parse_json_object(text)


def parse_json_object(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    fenced = re.search(r"```(?:json)?\s*(\{.*?\})\s*```", cleaned, flags=re.DOTALL | re.IGNORECASE)
    if fenced:
        cleaned = fenced.group(1)
    else:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            cleaned = cleaned[start : end + 1]

    try:
        parsed = json.loads(cleaned)
    except json.JSONDecodeError as exc:
        logger.error("Failed to parse JSON from Groq. Raw text:\n%s", cleaned)
        raise GroqAnalysisError(f"Groq returned invalid JSON. Raw response: {cleaned}") from exc

    if not isinstance(parsed, dict):
        raise GroqAnalysisError("Groq JSON response was not an object.")
    return parsed


groq_client = GroqClient()
