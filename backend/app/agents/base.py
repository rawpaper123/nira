import logging
from types import SimpleNamespace
from typing import Any

from langchain_community.chat_models import ChatTongyi

from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAICompatibleChatAdapter:
    def __init__(
        self,
        provider: str,
        api_key: str,
        model_name: str,
        temperature: float = 0.7,
        base_url: str | None = None,
    ):
        self.provider = provider
        self.api_key = api_key
        self.model_name = model_name
        self.temperature = temperature
        self.base_url = base_url

    async def ainvoke(self, messages: list[Any]):
        try:
            from openai import AsyncOpenAI
        except ImportError as exc:
            raise RuntimeError("openai package is not installed. Run: pip install openai") from exc

        client_kwargs = {"api_key": self.api_key}
        if self.base_url:
            client_kwargs["base_url"] = self.base_url

        client = AsyncOpenAI(**client_kwargs)
        response = await client.chat.completions.create(
            model=self.model_name,
            messages=[_message_to_dict(message) for message in messages],
            temperature=self.temperature,
        )
        content = response.choices[0].message.content or ""
        return SimpleNamespace(content=content)


class FallbackChatAdapter:
    def __init__(self, temperature: float = 0.7, model_name: str | None = None):
        self.temperature = temperature
        self.model_name = model_name
        self.providers = _build_provider_chain(temperature, model_name)

    async def ainvoke(self, messages: list[Any]):
        last_error: Exception | None = None

        for provider_name, provider in self.providers:
            try:
                if last_error is not None:
                    logger.warning("Trying fallback LLM provider %s", provider_name)
                return await provider.ainvoke(messages)
            except Exception as exc:
                last_error = exc
                logger.warning("%s LLM call failed: %s", provider_name, exc)

        if last_error:
            raise last_error
        raise RuntimeError("No LLM provider is configured")


def get_llm(temperature: float = 0.7, model_name: str | None = None) -> Any:
    return FallbackChatAdapter(temperature=temperature, model_name=model_name)


def _build_provider_chain(
    temperature: float = 0.7,
    model_name: str | None = None,
) -> list[tuple[str, Any]]:
    provider = (settings.llm_provider or "auto").lower()
    chain: list[tuple[str, Any]] = []

    if provider in ("auto", "deepseek") and settings.deepseek_api_key:
        chain.append((
            "DeepSeek",
            OpenAICompatibleChatAdapter(
                provider="DeepSeek",
                api_key=settings.deepseek_api_key,
                base_url=settings.deepseek_base_url,
                model_name=model_name or settings.deepseek_model,
                temperature=temperature,
            ),
        ))

    if provider in ("auto", "deepseek", "openai") and settings.openai_api_key:
        chain.append((
            "OpenAI",
            OpenAICompatibleChatAdapter(
                provider="OpenAI",
                api_key=settings.openai_api_key,
                model_name=model_name or settings.openai_model,
                temperature=temperature,
            ),
        ))

    if provider in ("auto", "deepseek", "openai", "qwen"):
        chain.append(("Qwen", _get_qwen_llm(temperature=temperature, model_name=model_name)))

    return chain


def _get_qwen_llm(
    temperature: float = 0.7,
    model_name: str | None = None,
) -> ChatTongyi:
    return ChatTongyi(
        model=model_name or settings.qwen_model_name,
        dashscope_api_key=settings.dashscope_api_key,
        temperature=temperature,
        streaming=True,
    )


def _message_to_dict(message: Any) -> dict:
    role = "user"
    message_type = getattr(message, "type", "")
    if message_type == "system":
        role = "system"
    elif message_type == "ai":
        role = "assistant"
    return {"role": role, "content": getattr(message, "content", str(message))}
