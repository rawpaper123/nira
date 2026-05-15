from uuid import UUID

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.profile_agent import build_profile as build_profile_with_ai
from app.core.config import settings
from app.models.user import User, UserProfile

logger = logging.getLogger(__name__)


async def build_user_profile(
    db: AsyncSession,
    user_id: UUID,
    raw_input: str,
) -> UserProfile:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError(f"User {user_id} not found")

    profile_data = await _build_profile_data(raw_input)
    availability = _merge_profile_metadata(profile_data)

    existing = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = existing.scalar_one_or_none()

    if profile:
        for key in ("interests", "activity_types", "personality_tags", "bio", "availability"):
            if key in profile_data:
                setattr(profile, key, availability if key == "availability" else profile_data[key])
    else:
        profile = UserProfile(
            user_id=user_id,
            interests=profile_data.get("interests", []),
            activity_types=profile_data.get("activity_types", []),
            personality_tags=profile_data.get("personality_tags", []),
            bio=profile_data.get("bio", ""),
            availability=availability,
        )
        db.add(profile)

    await db.flush()
    return profile


async def get_user_profile(db: AsyncSession, user_id: UUID) -> UserProfile | None:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    return result.scalar_one_or_none()


async def _build_profile_data(raw_input: str) -> dict:
    if settings.app_env == "development":
        return _mock_profile_from_text(raw_input)

    try:
        return await build_profile_with_ai(raw_input)
    except Exception as e:
        if settings.app_env != "development":
            raise
        logger.warning("AI profile build failed, using development mock: %s", e)
        return _mock_profile_from_text(raw_input)


def _merge_profile_metadata(profile_data: dict) -> dict:
    availability = profile_data.get("availability") or {}
    if not isinstance(availability, dict):
        availability = {}

    for key in (
        "preferred_name",
        "preferred_style",
        "preferred_gender",
        "preferred_type",
        "photo_urls",
        "photo_status",
    ):
        availability[key] = profile_data.get(key, _default_profile_value(key))
    return availability


def profile_to_response_data(profile: UserProfile) -> dict:
    availability = profile.availability or {}
    return {
        "user_id": profile.user_id,
        "interests": profile.interests or [],
        "activity_types": profile.activity_types or [],
        "personality_tags": profile.personality_tags or [],
        "bio": profile.bio or "",
        "availability": availability,
        "preferred_name": availability.get("preferred_name", ""),
        "preferred_style": availability.get("preferred_style", ""),
        "preferred_gender": availability.get("preferred_gender", "any"),
        "preferred_type": availability.get("preferred_type", ""),
        "photo_urls": availability.get("photo_urls", []),
        "photo_status": availability.get("photo_status", "pending"),
    }


def _mock_profile_from_text(raw_input: str) -> dict:
    text = raw_input or ""
    interests = []
    activity_types = []

    keyword_map = [
        (("咖啡", "coffee", "拿铁"), "咖啡探店", "coffee_chat"),
        (("徒步", "户外", "爬山", "hiking"), "户外徒步", "hiking"),
        (("展", "美术馆", "博物馆"), "看展", "exhibition"),
        (("电影", "影院"), "电影", "movie"),
        (("运动", "健身", "羽毛球", "跑步"), "运动", "sports"),
        (("桌游", "剧本杀"), "桌游", "board_game"),
        (("city", "散步", "压马路", "citywalk"), "城市漫步", "city_walk"),
    ]
    for keywords, interest, activity in keyword_map:
        if any(k.lower() in text.lower() for k in keywords):
            interests.append(interest)
            activity_types.append(activity)

    if not interests:
        interests = ["咖啡探店", "城市漫步"]
    if not activity_types:
        activity_types = ["coffee_chat", "city_walk"]

    preferred_gender = "any"
    if any(k in text for k in ("男生", "小哥哥", "男的")):
        preferred_gender = "male"
    elif any(k in text for k in ("女生", "小姐姐", "女的")):
        preferred_gender = "female"

    preferred_style = "极简高级感"
    for style in ("Y2K", "动漫风", "极简高级感", "氛围感", "治愈系", "老钱", "复古", "赛博朋克"):
        if style in text:
            preferred_style = style
            break

    return {
        "preferred_name": _extract_name(text),
        "interests": interests[:4],
        "activity_types": activity_types[:4],
        "personality_tags": ["chill", "social"],
        "bio": "有点会玩，也有点会生活",
        "preferred_style": preferred_style,
        "preferred_gender": preferred_gender,
        "preferred_type": _extract_preferred_type(text),
        "availability": {"weekdays": ["evening"], "weekends": ["afternoon", "evening"]},
        "photo_urls": [],
        "photo_status": "pending",
    }


def _extract_name(text: str) -> str:
    import re

    for pattern in (r"昵称/小名是：?(.+)", r"叫我(.{1,8})", r"名字是(.{1,8})"):
        match = re.search(pattern, text)
        if match:
            return match.group(1).splitlines()[0].strip(" ，。,.!")[:8] or "朋友"
    return "朋友"


def _extract_preferred_type(text: str) -> str:
    for marker in ("我想要的搭子/偏好类型：", "理想搭子", "想找"):
        if marker in text:
            value = text.split(marker, 1)[1].splitlines()[0].strip()
            return value[:40]
    return "聊得来、愿意一起出门探索的"


def _default_profile_value(key: str):
    defaults = {
        "preferred_name": "",
        "preferred_style": "",
        "preferred_gender": "any",
        "preferred_type": "",
        "photo_urls": [],
        "photo_status": "pending",
    }
    return defaults[key]
