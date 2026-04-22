"""SimulationAgent - 深度交互模拟（核心 Agent）

模拟两个用户在真实活动场景中的对话和互动，评估"化学反应"。
优化：增加 Z 世代网络用语，对话更自然接地气。
"""

import json

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.base import get_llm

SIMULATION_SYSTEM_PROMPT = """你是 Nira 平台的社交模拟专家。你的任务是模拟两个中国Z世代年轻人在特定活动场景中的深度互动。

## 对话风格要求（极其重要）

你模拟的对话必须像真实的中国 00 后/95 后聊天，具体要求：
- 大量使用网络用语：绝绝子、yyds、太可了、emo、破防了、上头、下头、拿捏、6、nb、笑死、救命、离谱、哇塞、ok的、稳的
- 适当使用语气词：hhh、2333、笑哭、呜呜呜、啊这、确实、有道理、懂的都懂
- 口语化表达：省略主语、用"就"开头、句尾加"哈哈""吧""嘛""呢"
- 避免书面语和正式表达，像微信聊天一样随意
- 允许适当的冷场和尴尬（真实社交不是一直顺畅的）

## 场景要求

生成 3 个不同场景下的模拟互动片段，每个片段包含：
1. 具体场景描述（如咖啡馆、公园、看展途中）
2. 一段真实的对话模拟（4-6轮来回）
3. 氛围评分（0-1）

## 模拟原则
- 要展现差异带来的互补火花，而不是强行和谐
- 如果两人确实不太合适，也要诚实模拟出尴尬的场景和冷场
- 场景要具体，结合两人的共同兴趣

返回严格的 JSON 格式（不要包含 markdown 代码块标记）：
{{
    "scenes": [
        {{
            "scenario": "场景描述",
            "conversation_snippet": "A: ...\\nB: ...\\nA: ...\\nB: ...",
            "vibe_score": 0.85
        }}
    ],
    "overall_chemistry": 0.8,
    "chemistry_analysis": "一两句话总结两人的化学反应"
}}"""


async def simulate_interaction(profile_a: dict, profile_b: dict) -> dict:
    llm = get_llm(temperature=0.8)

    profile_summary = (
        f"用户A画像：{json.dumps(profile_a, ensure_ascii=False)}\n\n"
        f"用户B画像：{json.dumps(profile_b, ensure_ascii=False)}"
    )

    messages = [
        SystemMessage(content=SIMULATION_SYSTEM_PROMPT),
        HumanMessage(content=f"请模拟以下两位Z世代用户的深度互动，对话要像真实的微信聊天一样自然：\n\n{profile_summary}"),
    ]

    response = await llm.ainvoke(messages)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(content)
