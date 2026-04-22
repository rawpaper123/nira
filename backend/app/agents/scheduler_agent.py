"""SchedulerAgent - 现实调度

负责生成具体的活动方案（时间、地点、活动详情）、生成活动海报文案、
以及微信群创建引导。让用户"零操作"就能参加活动。
优化：严格约束 activity_type 为单一类型。
"""

import json

from langchain_core.messages import HumanMessage, SystemMessage

from app.agents.base import get_llm

SCHEDULER_SYSTEM_PROMPT = """你是 Nira 平台的活动策划大师。

你需要为两位刚匹配的用户策划一次线下活动方案。

## 方案要求
- 活动类型必须是两人都有兴趣或愿意尝试的
- 地点选择要考虑两人的位置（优先市中心或两人之间的中间点）
- 时间建议要贴合两人的空闲时间
- 包含贴心的活动小贴士（如穿衣建议、交通方式）
- 活动时长一般 1-3 小时

## 海报文案要求
- 风格活泼、有吸引力
- 包含 emoji
- 50字以内

## 极其重要：activity_type 约束

activity_type 字段只能从以下列表中选择【一个】值，绝对不能出现混合值（如 "exhibition & hiking" 是错误的）：

hiking | coffee_chat | sports | exhibition | movie | board_game | cooking | city_walk | live_music | workshop

选择规则：优先选择两人兴趣列表中第一个共同出现的类型。如果没有任何共同类型，选择用户A最偏好且用户B愿意尝试的类型。

返回严格的 JSON 格式（不要包含 markdown 代码块标记）：
{{
    "plan": {{
        "title": "活动标题",
        "description": "活动描述（100字以内）",
        "activity_type": "只能从上面的列表选一个",
        "location": "具体地点建议",
        "suggested_time": "建议时间（如 本周六下午3点）",
        "duration": "预计时长",
        "tips": ["贴士1", "贴士2", "贴士3"]
    }},
    "poster_copy": "海报文案，带emoji，50字以内",
    "group_welcome": "微信群欢迎语，介绍两人认识的开场白"
}}"""


async def generate_activity_plan(
    profile_a: dict,
    profile_b: dict,
    compatibility: dict,
    city: str | None = None,
) -> dict:
    llm = get_llm(temperature=0.7)

    plan_input = (
        f"用户A画像：{json.dumps(profile_a, ensure_ascii=False)}\n\n"
        f"用户B画像：{json.dumps(profile_b, ensure_ascii=False)}\n\n"
        f"匹配评估：{json.dumps(compatibility, ensure_ascii=False)}\n\n"
        f"城市：{city or '上海'}"
    )

    messages = [
        SystemMessage(content=SCHEDULER_SYSTEM_PROMPT),
        HumanMessage(content=f"请为以下匹配用户策划一次线下活动：\n\n{plan_input}"),
    ]

    response = await llm.ainvoke(messages)
    content = response.content.strip()
    if content.startswith("```"):
        content = content.split("\n", 1)[1].rsplit("```", 1)[0].strip()
    result = json.loads(content)

    # 硬性兜底：如果 activity_type 仍包含 & 或空格混合值，取第一个
    at = result.get("plan", {}).get("activity_type", "")
    valid_types = {"hiking", "coffee_chat", "sports", "exhibition", "movie",
                   "board_game", "cooking", "city_walk", "live_music", "workshop"}
    if at not in valid_types:
        for t in valid_types:
            if t in at.lower():
                result["plan"]["activity_type"] = t
                break
        else:
            result["plan"]["activity_type"] = "coffee_chat"

    return result
