import logging
import re
from copy import deepcopy
from uuid import UUID

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


async def chat_user_profile(
    db: AsyncSession,
    user_id: UUID,
    message: str,
    conversation_id: str | None = None,
) -> dict:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError(f"User {user_id} not found")

    existing = await get_user_profile(db, user_id)
    current = profile_to_response_data(existing) if existing else _empty_profile_data(user_id)
    profile_patch, intent = _extract_chat_profile_patch(message, current)
    merged = _merge_chat_profile_patch(current, profile_patch, intent)

    if existing:
        existing.interests = merged.get("interests", [])
        existing.activity_types = merged.get("activity_types", [])
        existing.personality_tags = merged.get("personality_tags", [])
        existing.bio = merged.get("bio", "")
        existing.availability = merged.get("availability", {})
        profile = existing
    else:
        profile = UserProfile(
            user_id=user_id,
            interests=merged.get("interests", []),
            activity_types=merged.get("activity_types", []),
            personality_tags=merged.get("personality_tags", []),
            bio=merged.get("bio", ""),
            availability=merged.get("availability", {}),
        )
        db.add(profile)

    await db.flush()
    data = profile_to_response_data(profile)
    completion = _profile_chat_completion(data)
    data["profile_completed"] = completion["is_ready"]
    reply = _build_chat_reply(message, profile_patch, intent, data, completion)
    return {
        "status": "ok",
        "reply": reply,
        "profile_patch": profile_patch,
        "profile": data,
        "completion": completion,
        "intent": intent,
        "conversation_id": conversation_id,
    }


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


def profile_completion_data(profile_data: dict) -> dict:
    return _profile_chat_completion(profile_data)


def _empty_profile_data(user_id: UUID) -> dict:
    return {
        "user_id": user_id,
        "interests": [],
        "activity_types": [],
        "personality_tags": [],
        "bio": "",
        "availability": {
            "preferred_name": "",
            "preferred_style": "",
            "preferred_gender": "any",
            "preferred_type": "",
            "photo_urls": [],
            "photo_status": "pending",
            "negative_preferences": [],
            "preference_notes": [],
        },
        "preferred_name": "",
        "preferred_style": "",
        "preferred_gender": "any",
        "preferred_type": "",
        "photo_urls": [],
        "photo_status": "pending",
    }


def _extract_chat_profile_patch(message: str, current: dict) -> tuple[dict, str]:
    text = (message or "").strip()
    patch: dict = {}

    is_correction = any(marker in text for marker in ("不是", "说错", "刚刚说错", "改成", "改叫", "其实"))
    is_skip = any(marker in text for marker in ("不想填", "先不说", "跳过", "不想说", "随便"))

    preferred_name = _extract_chat_name(text)
    if preferred_name:
        patch["preferred_name"] = preferred_name

    interests, activity_types = _extract_interests_and_activities(text)
    if interests:
        patch["interests"] = interests
    if activity_types:
        patch["activity_types"] = activity_types

    preferred_gender = _extract_preferred_gender(text)
    if preferred_gender:
        patch["preferred_gender"] = preferred_gender

    preferred_type = _extract_preferred_type_from_chat(text)
    if preferred_type:
        patch["preferred_type"] = preferred_type

    availability_patch = _extract_availability_patch(text)
    if availability_patch:
        patch["availability"] = availability_patch

    negatives = _extract_negative_preferences(text)
    if negatives:
        patch.setdefault("availability", {})["negative_preferences"] = negatives

    notes = _extract_preference_notes(text)
    if notes:
        patch.setdefault("availability", {})["preference_notes"] = notes

    if not patch and is_skip:
        intent = "skip"
    elif is_correction:
        intent = "correct_profile"
    elif patch:
        intent = "update_profile"
    else:
        intent = "unclear"

    return patch, intent


def _merge_chat_profile_patch(current: dict, patch: dict, intent: str) -> dict:
    merged = {
        "user_id": current.get("user_id"),
        "interests": deepcopy(current.get("interests") or []),
        "activity_types": deepcopy(current.get("activity_types") or []),
        "personality_tags": deepcopy(current.get("personality_tags") or []),
        "bio": current.get("bio") or "",
        "availability": deepcopy(current.get("availability") or {}),
    }
    availability = merged["availability"]

    for key in ("preferred_name", "preferred_style", "preferred_gender", "preferred_type", "photo_urls", "photo_status"):
        availability.setdefault(key, current.get(key, _default_profile_value(key)))
    availability.setdefault("negative_preferences", [])
    availability.setdefault("preference_notes", [])

    if "preferred_name" in patch:
        availability["preferred_name"] = patch["preferred_name"]
    if "preferred_gender" in patch:
        availability["preferred_gender"] = patch["preferred_gender"]
        availability["preferred_gender_explicit"] = True
    if "preferred_type" in patch:
        availability["preferred_type"] = patch["preferred_type"]

    for value in patch.get("interests") or []:
        _append_unique(merged["interests"], value)
    for value in patch.get("activity_types") or []:
        _append_unique(merged["activity_types"], value)

    patch_availability = patch.get("availability") or {}
    for key, value in patch_availability.items():
        if key in ("negative_preferences", "preference_notes"):
            existing = availability.setdefault(key, [])
            for item in value or []:
                _append_unique(existing, item)
        elif key in ("weekdays", "weekends"):
            existing = availability.setdefault(key, [])
            for item in value or []:
                _append_unique(existing, item)
        else:
            availability[key] = value

    if not merged["personality_tags"]:
        merged["personality_tags"] = ["chill", "curious"]

    name = availability.get("preferred_name") or "朋友"
    if merged["interests"]:
        merged["bio"] = f"{name}，喜欢{('、').join(merged['interests'][:3])}，偏轻松自然的活动搭子。"
    elif not merged["bio"]:
        merged["bio"] = f"{name}，想找轻松一点的城市活动搭子。"

    merged["preferred_name"] = availability.get("preferred_name", "")
    merged["preferred_style"] = availability.get("preferred_style", "")
    merged["preferred_gender"] = availability.get("preferred_gender", "any")
    merged["preferred_type"] = availability.get("preferred_type", "")
    merged["photo_urls"] = availability.get("photo_urls", [])
    merged["photo_status"] = availability.get("photo_status", "pending")
    return merged


def _profile_chat_completion(profile: dict) -> dict:
    availability = profile.get("availability") or {}
    missing_fields = []

    if not profile.get("preferred_name"):
        missing_fields.append("preferred_name")
    if not profile.get("interests"):
        missing_fields.append("interests")
    gender_ready = (
        bool(profile.get("preferred_type"))
        or profile.get("preferred_gender") not in ("", "any", None)
        or bool(availability.get("preferred_gender_explicit"))
    )
    if not gender_ready:
        missing_fields.append("preferred_type_or_gender")
    if not (availability.get("weekdays") or availability.get("weekends") or availability.get("time_preference_text")):
        missing_fields.append("availability")

    return {
        "is_ready": not missing_fields,
        "missing_fields": missing_fields,
    }


def _build_chat_reply(message: str, patch: dict, intent: str, profile: dict, completion: dict) -> str:
    next_question = _next_profile_question(completion.get("missing_fields", []))
    name = profile.get("preferred_name") or "你"

    if intent == "skip":
        return f"没关系，这个先放着也行。{next_question or '这些信息已经够先跑一次匹配了，之后想补充再说就好。'}"

    if intent == "unclear":
        return next_question or "这句我先不硬记，免得记偏。想改名字、活动、时间或边界感，直接说就行。"

    if "preferred_name" in patch and intent == "correct_profile":
        base = f"好，之前的称呼我覆盖掉，之后就叫你 {patch['preferred_name']}。"
    elif "preferred_name" in patch:
        base = f"那我先叫你 {patch['preferred_name']}。"
    elif (patch.get("availability") or {}).get("negative_preferences"):
        base = "懂了，这类我会帮你避开，见面还是低压力一点比较舒服。"
    elif patch.get("preferred_type"):
        base = f"明白，你更偏{_display_preferred_type(patch['preferred_type'])}这种连接。"
    elif patch.get("preferred_gender"):
        base = "性别这块我知道了，重点还是帮你找聊得来的人。"
    elif patch.get("availability"):
        base = "这个时间段挺适合安排轻一点的活动，不会太赶。"
    elif patch.get("interests"):
        base = f"{('、').join(patch['interests'][:2])}这个方向挺适合找活动搭子。"
    else:
        base = f"我大概懂了，{name}。"

    if completion.get("is_ready"):
        return f"{base} 现在信息够先加入本周匹配了；后面想改偏好，继续跟我说就行。"
    return f"{base} {next_question}"


def _next_profile_question(missing_fields: list[str]) -> str:
    if "preferred_name" in missing_fields:
        return "我先知道怎么叫你就行，朋友平时一般怎么称呼你？"
    if "interests" in missing_fields:
        return "我再抓一个小点：你最近更愿意尝试哪类轻松活动？"
    if "preferred_type_or_gender" in missing_fields:
        return "你这次更想找一起玩的朋友/搭子，还是也接受一点点暧昧感？"
    if "availability" in missing_fields:
        return "那你一般什么时候比较方便见新朋友？比如工作日晚上、周末下午这种。"
    return ""


def _extract_chat_name(text: str) -> str:
    patterns = [
        r"别叫我[A-Za-z0-9_\-\u4e00-\u9fff]{1,16}[，,。.\s]*(?:我叫|叫我|名字改成|改成)\s*([A-Za-z0-9_\-\u4e00-\u9fff]{1,16})",
        r"(?:名字改成|改成|改叫)\s*([A-Za-z0-9_\-\u4e00-\u9fff]{1,16})",
        r"(?:我叫|(?<!别)叫我|名字叫|名字是|昵称是|小名是)\s*([A-Za-z0-9_\-\u4e00-\u9fff]{1,16})",
        r"我是\s*([A-Za-z][A-Za-z0-9_\-]{1,16}|[\u4e00-\u9fff]{1,6})",
    ]
    stop_words = {"男生", "女生", "朋友", "搭子", "学生", "上班族"}
    for pattern in patterns:
        match = re.search(pattern, text)
        if match:
            value = match.group(1).strip(" ，。,.!！?？")
            if value and value not in stop_words:
                return value[:16]
    return ""


def _extract_interests_and_activities(text: str) -> tuple[list[str], list[str]]:
    keyword_map = [
        (("citywalk", "城市漫步", "压马路"), "citywalk", "city_walk"),
        (("看展", "展览", "美术馆", "博物馆"), "看展", "exhibition"),
        (("咖啡", "咖啡店", "探店"), "咖啡", "coffee_chat"),
        (("徒步", "爬山", "hiking"), "徒步", "hiking"),
        (("书店", "逛书店"), "书店", "bookstore"),
        (("公园", "散步"), "公园散步", "city_walk"),
        (("市集", "集市"), "市集", "market"),
        (("小众餐厅", "餐厅", "吃饭"), "小众餐厅", "food"),
        (("电影", "影院"), "电影", "movie"),
        (("桌游", "剧本杀"), "桌游", "board_game"),
        (("运动", "羽毛球", "跑步", "健身"), "运动", "sports"),
        (("livehouse", "live house", "音乐", "演出"), "livehouse", "live_music"),
    ]
    interests: list[str] = []
    activity_types: list[str] = []
    lower = text.lower()
    for keywords, interest, activity_type in keyword_map:
        if any(keyword.lower() in lower for keyword in keywords):
            _append_unique(interests, interest)
            _append_unique(activity_types, activity_type)
    return interests, activity_types


def _extract_preferred_gender(text: str) -> str:
    if any(marker in text for marker in ("都可以", "不限", "无所谓", "没要求", "女生男生都可以", "男生女生都可以")):
        return "any"
    has_male = "男生" in text or "男的" in text or "小哥哥" in text
    has_female = "女生" in text or "女的" in text or "小姐姐" in text
    if has_male and not has_female:
        return "male"
    if has_female and not has_male:
        return "female"
    return ""


def _extract_preferred_type_from_chat(text: str) -> str:
    if any(marker in text for marker in ("饭搭子", "运动搭子", "展览搭子", "看展搭子", "活动搭子", "搭子")):
        return "friends/activity_partner"
    if any(marker in text for marker in ("只想找一起玩的朋友", "只想认识朋友", "朋友", "一起玩")):
        return "friends/activity_partner"
    if any(marker in text for marker in ("暧昧", "恋爱", "心动")):
        return "open_to_romance"
    if "随缘" in text:
        return "open_flexible"
    return ""


def _extract_availability_patch(text: str) -> dict:
    availability: dict = {}
    time_texts: list[str] = []

    if "工作日晚上" in text or "平时晚上" in text or "下班后" in text:
        availability.setdefault("weekdays", [])
        _append_unique(availability["weekdays"], "evening")
        time_texts.append("下班后" if "下班后" in text else "工作日晚上")
    if "工作日" in text and "晚上" not in text:
        availability.setdefault("weekdays", [])
        _append_unique(availability["weekdays"], "evening")
        time_texts.append("工作日")
    if "周末下午" in text:
        availability.setdefault("weekends", [])
        _append_unique(availability["weekends"], "afternoon")
        time_texts.append("周末下午")
    elif "周末" in text:
        availability.setdefault("weekends", [])
        if "上午" in text:
            _append_unique(availability["weekends"], "morning")
            time_texts.append("周末上午")
        elif "晚上" in text:
            _append_unique(availability["weekends"], "evening")
            time_texts.append("周末晚上")
        else:
            _append_unique(availability["weekends"], "afternoon")
            time_texts.append("周末")
    if "最近都行" in text or "最近都可以" in text:
        availability["flexible"] = True
        time_texts.append("最近都行")
    elif "最近" in text:
        time_texts.append("最近")

    if time_texts:
        availability["time_preference_text"] = "、".join(time_texts)
    return availability


def _extract_negative_preferences(text: str) -> list[str]:
    negatives: list[str] = []
    if any(marker in text for marker in ("不想太像约会", "不要约会", "不像约会", "约会感")):
        negatives.append("不要约会感")
    if "相亲感" in text:
        negatives.append("不要相亲感")
    if "酒吧" in text and any(marker in text for marker in ("不喜欢", "不想", "雷", "别给我", "太吵")):
        negatives.append("酒吧")
    if "太吵" in text:
        negatives.append("太吵")

    patterns = [
        r"(?:不喜欢|不想|不要|雷|别给我|别安排)\s*([^，。,.!！?？]{1,20})",
    ]
    for pattern in patterns:
        for match in re.finditer(pattern, text):
            value = match.group(1).strip()
            if value:
                negatives.append(value)
    return _unique(negatives)


def _extract_preference_notes(text: str) -> list[str]:
    notes = []
    if "聊得来" in text:
        notes.append("主要看聊不聊得来")
    if "随缘" in text:
        notes.append("偏随缘，不想太有压力")
    if "低压力" in text:
        notes.append("偏低压力见面")
    return notes


def _display_preferred_type(value: str) -> str:
    if value == "friends/activity_partner":
        return "朋友/活动搭子"
    if value == "open_to_romance":
        return "可以有一点暧昧感"
    return value


def _append_unique(values: list, value: str) -> None:
    if value and value not in values:
        values.append(value)


def _unique(values: list[str]) -> list[str]:
    result: list[str] = []
    for value in values:
        _append_unique(result, value)
    return result


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
