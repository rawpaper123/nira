"""Development-safe poster card helpers.

This module intentionally does not call image generation, COS, or any LLM.
It only creates small text-card metadata that the Mini Program can render.
"""

from __future__ import annotations


def build_poster_card(
    profile_a: dict | None = None,
    profile_b: dict | None = None,
    plan: dict | None = None,
    compatibility: dict | None = None,
    activity_label: str | None = None,
    city: str = "上海",
) -> dict:
    """Build a local text-card poster for development/demo flows."""

    profile_a = profile_a or {}
    profile_b = profile_b or {}
    plan = plan or {}
    compatibility = compatibility or {}

    activity = (
        activity_label
        or plan.get("activity_type")
        or plan.get("title")
        or _first(profile_a.get("activity_types"))
        or _first(profile_b.get("activity_types"))
        or "咖啡散步"
    )
    activity_text = _activity_label(activity)
    tags = _collect_tags(profile_a, profile_b, activity_text)
    name_a = _display_name(profile_a, "你")
    name_b = _display_name(profile_b, "活动搭子")
    score = compatibility.get("overall_score")
    score_text = f"{round(score * 100)}%" if isinstance(score, (int, float)) else "刚刚好"

    return {
        "status": "mocked",
        "type": "text_card",
        "title": f"{activity_text}，轻松一点",
        "subtitle": " / ".join(tags[:3]) if tags else f"{city} · 低压力见面",
        "copy": (
            f"Nira 给 {name_a} 和 {name_b} 留了一个不赶时间的开场："
            f"{activity_text}，匹配感 {score_text}。先把节奏放轻，"
            "能聊就多走一段，不合拍也不用尴尬。"
        ),
        "style": "black_white_minimal",
        "tags": tags[:4],
    }


def _display_name(profile: dict, fallback: str) -> str:
    availability = profile.get("availability") or {}
    return (
        profile.get("preferred_name")
        or availability.get("preferred_name")
        or profile.get("nickname")
        or fallback
    )


def _collect_tags(profile_a: dict, profile_b: dict, activity_text: str) -> list[str]:
    tags: list[str] = [activity_text]
    for profile in (profile_a, profile_b):
        for field in ("interests", "activity_types", "personality_tags"):
            for item in profile.get(field) or []:
                label = _activity_label(str(item))
                if label and label not in tags:
                    tags.append(label)
    return tags


def _activity_label(value: str) -> str:
    value = (value or "").strip()
    labels = {
        "city_walk": "Citywalk",
        "citywalk": "Citywalk",
        "exhibition": "看展",
        "coffee_chat": "咖啡散步",
        "coffee": "咖啡散步",
        "hiking": "公园散步",
        "sports": "轻运动",
        "board_game": "桌游",
        "movie": "电影",
    }
    return labels.get(value, value or "咖啡散步")


def _first(items: list | tuple | None) -> str | None:
    if not items:
        return None
    return str(items[0])
