"""CompatibilityAgent - 兼容性评估

综合画像相似度、互补性和模拟结果，给出最终的匹配分数和多维度评估。
优化：分数有明确区分度（60-95范围），稀有兴趣高权重，性格互补加权。
"""

import json

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.base import get_llm

COMPATIBILITY_SYSTEM_PROMPT = """你是 Nira 平台的匹配评估专家。你需要严格、客观地评估两位用户的兼容性。

## 评估维度与权重

| 维度 | 权重 | 评分标准 |
|------|------|----------|
| interest_overlap | 25% | 共同兴趣占比。**关键规则**：稀有共同兴趣（如climbing, workshop, live_music）权重 ×2；常见兴趣（如movie, coffee_chat）权重 ×0.5 |
| personality_complement | 35% | 性格是否互补。extrovert+introvert=高互补；同类型=低互补。差异越大分越高，但极端对立（完全无法沟通）要扣分 |
| schedule_compatibility | 15% | 空闲时间段重合度。重合越多分越高，完全不重合=0.1 |
| chemistry_from_sim | 25% | 直接取模拟中的 overall_chemistry 分数。模拟结果是最终检验 |

## 评分校准规则（极其重要）

你必须让 overall_score 在 0.60-0.95 之间有明显区分度：
- **天作之合**（兴趣互补+性格互补+chemistry>0.85+时间重合）：0.90-0.95
- **很不错**（多数维度良好但有1-2个短板）：0.80-0.89
- **还行**（有共同点但互补性一般）：0.70-0.79
- **勉强**（差异较大或chemistry偏低）：0.60-0.69
- **不合适**（几乎无共同点或chemistry<0.4）：低于0.60

绝对不要把所有匹配都评到 0.82-0.85 的窄区间！要敢于给出高分和低分。

## 计算公式

overall_score = interest_overlap × 0.25 + personality_complement × 0.35 + schedule_compatibility × 0.15 + chemistry_from_sim × 0.25

返回严格的 JSON 格式（不要包含 markdown 代码块标记）：
{{
    "overall_score": 0.85,
    "interest_overlap": 0.6,
    "personality_complement": 0.9,
    "schedule_compatibility": 0.8,
    "chemistry_from_sim": 0.83,
    "reasoning": "一段简短的中文评估，具体说明每个维度的表现"
}}"""


async def evaluate_compatibility(
    profile_a: dict,
    profile_b: dict,
    simulation_result: dict,
) -> dict:
    llm = get_llm(temperature=0.3)

    evaluation_input = (
        f"用户A画像：{json.dumps(profile_a, ensure_ascii=False)}\n\n"
        f"用户B画像：{json.dumps(profile_b, ensure_ascii=False)}\n\n"
        f"互动模拟结果：{json.dumps(simulation_result, ensure_ascii=False)}"
    )

    messages = [
        SystemMessage(content=COMPATIBILITY_SYSTEM_PROMPT),
        HumanMessage(content=f"请严格按评分规则评估以下两位用户的兼容性：\n\n{evaluation_input}"),
    ]

    response = await llm.ainvoke(messages)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    return json.loads(content)
