"""ProfileAgent - 用户画像解析

接收用户的自由文本输入，通过通义千问分析并生成结构化用户画像：
兴趣标签、活动偏好、性格标签、可用时间段。
"""

import json

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.base import get_llm

PROFILE_SYSTEM_PROMPT = """你是 Nira 平台的用户画像分析专家。

你的任务是从用户的自由文本描述中提取结构化画像信息。

你必须返回严格的 JSON 格式（不要包含 markdown 代码块标记）：
{{
    "interests": ["兴趣1", "兴趣2", ...],
    "activity_types": ["活动类型1", "活动类型2", ...],
    "personality_tags": ["性格标签1", "性格标签2", ...],
    "bio": "一段50字以内的个性签名",
    "availability": {{
        "weekdays": ["evening"],
        "weekends": ["morning", "afternoon"]
    }}
}}

可选活动类型：hiking, coffee_chat, sports, exhibition, movie, board_game, cooking, city_walk, live_music, workshop
可选性格标签：extrovert, introvert, creative, analytical, adventurous, chill, foodie, artsy, sporty, social
可选时间段：morning, afternoon, evening, night

分析要准确、标签要精准，不要臆造用户没提到的内容。"""


async def build_profile(user_input: str) -> dict:
    llm = get_llm(temperature=0.3)
    messages = [
        SystemMessage(content=PROFILE_SYSTEM_PROMPT),
        HumanMessage(content=f"请分析以下用户描述并生成画像：\n\n{user_input}"),
    ]
    response = await llm.ainvoke(messages)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(content)


async def build_profile_from_answers(answers: dict) -> dict:
    llm = get_llm(temperature=0.3)
    answers_text = "\n".join(f"Q: {k}\nA: {v}" for k, v in answers.items())
    messages = [
        SystemMessage(content=PROFILE_SYSTEM_PROMPT),
        HumanMessage(content=f"请根据以下问卷回答生成用户画像：\n\n{answers_text}"),
    ]
    response = await llm.ainvoke(messages)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(content)
