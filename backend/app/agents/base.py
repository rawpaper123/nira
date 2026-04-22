from langchain_community.chat_models import ChatTongyi

from app.core.config import settings


def get_llm(temperature: float = 0.7, model_name: str | None = None) -> ChatTongyi:
    return ChatTongyi(
        model=model_name or settings.qwen_model_name,
        dashscope_api_key=settings.dashscope_api_key,
        temperature=temperature,
        streaming=True,
    )
