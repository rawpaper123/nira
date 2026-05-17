import datetime
import logging
from uuid import UUID, uuid4

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.poster_agent import build_poster_card
from app.agents.compatibility_agent import evaluate_compatibility
from app.agents.simulation_agent import simulate_interaction
from app.core.config import settings
from app.models.user import User, UserProfile, Match

logger = logging.getLogger(__name__)

# ---- 匹配队列（MVP：内存队列） ----
_match_queue: list[dict] = []
_mock_match_results: dict[str, dict] = {}

# ---- 匹配接受状态（MVP：内存存储） ----
_match_accepts: dict[str, dict] = {}  # match_id -> {user_a_accepted, user_b_accepted, group_id, group_created}
_group_messages: dict[str, list[dict]] = {}  # group_id -> [messages]
_group_infos: dict[str, dict] = {}  # group_id -> mock group detail


def add_to_queue(user_id: str, profile: dict | None = None) -> dict:
    """加入匹配队列，返回稳定队列状态"""
    global _match_queue

    if not _profile_is_complete(profile):
        return {
            "status": "profile_required",
            "queue_position": 0,
            "message": "请先完成画像，再加入本周匹配队列",
        }

    # 避免重复加入
    for item in _match_queue:
        if item["user_id"] == user_id:
            if profile:
                item["profile"] = profile
            position = _match_queue.index(item) + 1
            return {
                "status": "already_joined",
                "queue_position": position,
                "message": f"你已经在本周匹配队列中，当前队列第 {position} 位",
            }

    _match_queue.append({
        "user_id": user_id,
        "profile": profile,
        "joined_at": datetime.datetime.now().isoformat(),
    })
    position = len(_match_queue)
    return {
        "status": "joined",
        "queue_position": position,
        "message": f"已加入本周匹配队列，当前队列第 {position} 位",
    }


def get_queue() -> list[dict]:
    return _match_queue


def clear_queue():
    global _match_queue
    _match_queue = []


def get_queue_status(user_id: str) -> dict:
    for index, item in enumerate(_match_queue):
        if item["user_id"] == user_id:
            return {
                "status": "queued",
                "queue_position": index + 1,
                "message": "已加入本周匹配队列，周三 19:00 揭晓结果",
            }
    return {
        "status": "not_joined",
        "queue_position": 0,
        "message": "还没有加入本周匹配队列",
    }


def _current_week_number() -> int:
    now = datetime.datetime.now()
    return int(now.strftime("%Y%W"))


async def run_weekly_match(
    db: AsyncSession,
    user_id: UUID,
    city: str | None = None,
) -> dict:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        raise ValueError(f"User {user_id} has no profile. Build profile first.")

    week = _current_week_number()

    if settings.app_env == "development":
        return await _run_development_match(db, user_id, profile, week)

    existing = await db.execute(
        select(Match).where(
            and_(
                Match.user_a_id == user_id,
                Match.week_number == week,
                Match.status == "matched",
            )
        )
    )
    if existing.scalar_one_or_none():
        raise ValueError("Already matched this week")

    candidates = await db.execute(
        select(UserProfile).where(UserProfile.user_id != user_id).limit(20)
    )
    candidate_profiles = candidates.scalars().all()
    if not candidate_profiles:
        raise ValueError("No candidates available")

    profile_a = {
        "interests": profile.interests or [],
        "activity_types": profile.activity_types or [],
        "personality_tags": profile.personality_tags or [],
        "bio": profile.bio or "",
        "availability": profile.availability or {},
    }

    best_match = None
    best_score = 0.0
    best_simulation = None
    best_compatibility = None
    best_candidate_profile = None

    for candidate in candidate_profiles[:5]:
        profile_b = {
            "interests": candidate.interests or [],
            "activity_types": candidate.activity_types or [],
            "personality_tags": candidate.personality_tags or [],
            "bio": candidate.bio or "",
            "availability": candidate.availability or {},
        }

        simulation = await simulate_interaction(profile_a, profile_b)
        compatibility = await evaluate_compatibility(profile_a, profile_b, simulation)
        score = compatibility.get("overall_score", 0.0)

        if score > best_score:
            best_score = score
            best_match = candidate
            best_simulation = simulation
            best_compatibility = compatibility
            best_candidate_profile = profile_b

    if not best_match:
        raise ValueError("No suitable match found")

    match_record = Match(
        id=uuid4(),
        user_a_id=user_id,
        user_b_id=best_match.user_id,
        score=best_score,
        simulation_result=best_simulation,
        compatibility_detail=best_compatibility,
        week_number=week,
        status="matched",
    )
    db.add(match_record)
    await db.flush()

    user_b_result = await db.execute(select(User).where(User.id == best_match.user_id))
    user_b = user_b_result.scalar_one_or_none()

    result = {
        "match_id": str(match_record.id),
        "user_b_id": str(best_match.user_id),
        "user_b_nickname": user_b.nickname if user_b else None,
        "user_b_avatar": user_b.avatar_url if user_b else None,
        "score": best_score,
        "simulation": best_simulation.get("scenes", []) if best_simulation else [],
        "compatibility": best_compatibility,
        "week_number": week,
        "total_candidates": len(candidate_profiles),
    }

    # 匹配成功后异步推送通知（不阻塞主流程）
    await _notify_match_result(result, str(user_id))

    return result


async def get_match_result(db: AsyncSession, user_id: UUID) -> dict:
    result = await db.execute(
        select(Match)
        .where(
            and_(
                Match.user_a_id == user_id,
                Match.week_number == _current_week_number(),
                Match.status == "matched",
            )
        )
        .order_by(Match.created_at.desc())
    )
    match = result.scalar_one_or_none()
    if match:
        return await _match_record_to_result(db, match)

    cached = _mock_match_results.get(str(user_id))
    if cached:
        return cached

    queue_status = get_queue_status(str(user_id))
    return {
        "matches": [],
        "week_number": _current_week_number(),
        "total_candidates": max(0, len(_match_queue) - 1),
        "status": "waiting" if queue_status["status"] == "queued" else "not_joined",
        "message": queue_status["message"],
    }


async def _run_development_match(
    db: AsyncSession,
    user_id: UUID,
    profile: UserProfile,
    week: int,
) -> dict:
    existing = await db.execute(
        select(Match).where(
            and_(
                Match.user_a_id == user_id,
                Match.week_number == week,
                Match.status == "matched",
            )
        )
    )
    existing_match = existing.scalar_one_or_none()
    if existing_match:
        return await _match_record_to_result(db, existing_match)

    candidates = await db.execute(
        select(UserProfile).where(UserProfile.user_id != user_id).limit(5)
    )
    candidate_profiles = candidates.scalars().all()
    if candidate_profiles:
        candidate = candidate_profiles[0]
        result = _build_mock_match_result(str(user_id), profile, str(candidate.user_id), candidate, week)
        match_record = Match(
            id=UUID(result["matches"][0]["match_id"]),
            user_a_id=user_id,
            user_b_id=candidate.user_id,
            score=result["matches"][0]["score"],
            simulation_result={"scenes": result["matches"][0]["simulation"]},
            compatibility_detail=result["matches"][0]["compatibility"],
            week_number=week,
            status="matched",
        )
        db.add(match_record)
        await db.flush()
        _mock_match_results[str(user_id)] = result
        return result

    queue_status = get_queue_status(str(user_id))
    return {
        "matches": [],
        "week_number": week,
        "total_candidates": 0,
        "status": "waiting" if queue_status["status"] == "queued" else "not_joined",
        "message": queue_status["message"] if queue_status["status"] == "queued" else "还没有候选用户，先加入队列等周三 19:00 揭晓吧",
    }


async def _match_record_to_result(db: AsyncSession, match: Match) -> dict:
    user_b_result = await db.execute(select(User).where(User.id == match.user_b_id))
    user_b = user_b_result.scalar_one_or_none()
    profile_b_result = await db.execute(select(UserProfile).where(UserProfile.user_id == match.user_b_id))
    profile_b = profile_b_result.scalar_one_or_none()
    profile_stub = profile_b or UserProfile(
        user_id=match.user_b_id,
        interests=[],
        activity_types=[],
        personality_tags=[],
        bio="",
        availability={},
    )
    return _build_mock_match_result(
        str(match.user_a_id),
        None,
        str(match.user_b_id),
        profile_stub,
        match.week_number,
        match_id=str(match.id),
        score=match.score,
        compatibility=match.compatibility_detail,
        simulation=match.simulation_result.get("scenes", []) if match.simulation_result else [],
        nickname=user_b.nickname if user_b else None,
    )


def _build_mock_match_result(
    user_a_id: str,
    profile_a: UserProfile | None,
    user_b_id: str,
    profile_b: UserProfile,
    week: int,
    match_id: str | None = None,
    score: float = 0.86,
    compatibility: dict | None = None,
    simulation: list[dict] | None = None,
    nickname: str | None = None,
) -> dict:
    availability = profile_b.availability or {}
    display_name = nickname or availability.get("preferred_name") or "Nira 活动搭子"
    activity = _suggest_activity(profile_b)
    compatibility = compatibility or {
        "overall_score": score,
        "interest_overlap": 0.82,
        "personality_complement": 0.78,
        "schedule_compatibility": 0.76,
        "chemistry_from_sim": 0.88,
        "reasoning": f"你们都挺适合从{activity}这种轻松活动开始，话题不会太硬凹，节奏也比较舒服。",
    }
    simulation = simulation or [
        {
            "scenario": f"周末下午约去{activity}",
            "conversation_snippet": "A: 这个安排可以诶，不用太赶\nB: 对，我也喜欢轻松点的局 hhh\nA: 那就边逛边聊？\nB: 稳的，感觉不会尬",
            "vibe_score": 0.86,
        }
    ]
    reasons = [
        compatibility.get("reasoning", "你们的兴趣和时间节奏比较搭。"),
        "本地 mock 匹配：用于验证小程序匹配结果页流程。",
    ]
    poster = build_poster_card(
        profile_a=_profile_to_dict(profile_a),
        profile_b=_profile_to_dict(profile_b),
        compatibility=compatibility,
        activity_label=activity,
    )
    return {
        "matches": [
            {
                "match_id": match_id or str(uuid4()),
                "user_b_id": user_b_id,
                "user_b_nickname": display_name,
                "user_b_avatar": None,
                "score": score,
                "simulation": simulation,
                "compatibility": compatibility,
                "matched_user_name": display_name,
                "compatibility_score": round(score * 100),
                "reasons": reasons,
                "suggested_activity": activity,
                "poster": poster,
                "poster_copy": poster.get("copy", ""),
                "status": "matched",
            }
        ],
        "week_number": week,
        "total_candidates": 1,
        "status": "matched",
        "message": "development mock match ready",
    }


def _suggest_activity(profile: UserProfile) -> str:
    activities = profile.activity_types or []
    if "exhibition" in activities:
        return "看展 + city walk"
    if "hiking" in activities:
        return "轻徒步"
    if "sports" in activities:
        return "运动局"
    if "board_game" in activities:
        return "桌游局"
    return "咖啡聊天"


def _profile_to_dict(profile: UserProfile | None) -> dict:
    if not profile:
        return {}
    return {
        "interests": profile.interests or [],
        "activity_types": profile.activity_types or [],
        "personality_tags": profile.personality_tags or [],
        "bio": profile.bio or "",
        "availability": profile.availability or {},
    }


def _profile_is_complete(profile: dict | None) -> bool:
    if not profile:
        return False
    return bool(profile.get("interests") or profile.get("activity_types") or profile.get("bio"))


async def _notify_match_result(match_result: dict, user_id: str):
    """匹配成功后推送通知给用户"""
    try:
        from app.services.push_service import get_subscription, push_match_result

        sub = get_subscription(user_id)
        if not sub or not sub.get("subscribed"):
            return

        openid = sub.get("openid")
        if not openid:
            return

        score = int((match_result.get("score") or 0) * 100)
        nickname = match_result.get("user_b_nickname") or "活动搭子"
        match_id = match_result.get("match_id", "")

        await push_match_result(
            openid=openid,
            match_id=match_id,
            score=score,
            nickname=nickname,
        )
    except Exception as e:
        import logging
        logging.warning(f"推送匹配结果失败: {e}")


# ---- 接受/拒绝匹配 + 拉群逻辑 ----


def _get_match_accept(match_id: str) -> dict:
    if match_id not in _match_accepts:
        _match_accepts[match_id] = {
            "match_id": match_id,
            "user_a_accepted": False,
            "user_b_accepted": False,
            "group_id": None,
            "group_created": False,
        }
    return _match_accepts[match_id]


def accept_match(match_id: str, user_id: str, role: str) -> dict:
    """用户接受匹配。role = 'a' | 'b'。

    返回:
      - status: accepted_first | both_accepted
      - group_id: 群聊 ID（先接受时创建）
      - waiting_for: 等待对方的提示
    """
    ma = _get_match_accept(match_id)

    if role == "a":
        if ma["user_a_accepted"]:
            return {"status": "already_accepted", "group_id": ma["group_id"]}
        ma["user_a_accepted"] = True
    else:
        if ma["user_b_accepted"]:
            return {"status": "already_accepted", "group_id": ma["group_id"]}
        ma["user_b_accepted"] = True

    # 第一个接受的人 → 创建群聊
    if not ma["group_created"]:
        group_id = f"group-{uuid4().hex[:12]}"
        ma["group_id"] = group_id
        ma["group_created"] = True

        # Nira AI 欢迎消息
        _group_messages[group_id] = [
            {
                "id": "welcome-1",
                "sender": "Nira AI",
                "content": "已接受匹配。先不用急着聊，Nira 正在把活动安排整理好。",
                "isSystem": True,
                "time": _now_time(),
            }
        ]
        register_group_info(_build_mock_group_info(group_id, match_id, "accepted"))

    both = ma["user_a_accepted"] and ma["user_b_accepted"]

    if both:
        # 双方都接受了 → 添加欢迎消息
        gid = ma["group_id"]
        _group_messages[gid].append({
            "id": "welcome-2",
            "sender": "Nira AI",
            "content": "你们这次的见面已经安排好啦。先不用急着尬聊，Nira 给你们准备了几个轻松开场。",
            "isSystem": True,
            "time": _now_time(),
        })
        register_group_info(_build_mock_group_info(gid, match_id, "group_created"))
        return {
            "status": "both_accepted",
            "group_id": ma["group_id"],
        }

    return {
        "status": "accepted_first",
        "group_id": ma["group_id"],
        "waiting_for": "b" if role == "a" else "a",
    }


def reject_match(match_id: str, user_id: str) -> dict:
    ma = _get_match_accept(match_id)
    ma["user_a_accepted"] = False
    ma["user_b_accepted"] = False
    ma["group_created"] = False
    gid = ma.get("group_id")
    if gid and gid in _group_messages:
        del _group_messages[gid]
    ma["group_id"] = None
    return {"status": "rejected"}


def register_group_info(info: dict) -> dict:
    group_id = info.get("group_id")
    if not group_id:
        return info
    existing = _group_infos.get(group_id, {})
    merged = {**existing, **info}
    _group_infos[group_id] = merged
    return merged


def get_group_info(group_id: str) -> dict | None:
    """获取群聊信息：成员状态 + 消息列表"""
    messages = _group_messages.get(group_id, [])
    stored_info = _group_infos.get(group_id, {})

    # 找到对应的 match_accept 记录
    match_info = None
    for mid, ma in _match_accepts.items():
        if ma.get("group_id") == group_id:
            match_info = ma
            break

    both_accepted = False
    if match_info:
        both_accepted = match_info["user_a_accepted"] and match_info["user_b_accepted"]

    fallback = _build_mock_group_info(
        group_id,
        stored_info.get("match_id") or (match_info or {}).get("match_id") or "",
        "group_created" if both_accepted else "accepted",
    )
    return {
        **fallback,
        **stored_info,
        "group_id": group_id,
        "both_accepted": both_accepted,
        "messages": messages,
    }


def send_group_message(group_id: str, sender: str, content: str, is_me: bool = False) -> dict:
    if group_id not in _group_messages:
        _group_messages[group_id] = []

    msg = {
        "id": f"msg-{uuid4().hex[:8]}",
        "sender": sender,
        "content": content,
        "isSystem": False,
        "isMe": is_me,
        "isOther": not is_me,
        "time": _now_time(),
    }
    _group_messages[group_id].append(msg)
    return msg


def _now_time() -> str:
    from datetime import datetime
    d = datetime.now()
    return f"{d.hour:02d}:{d.minute:02d}"


def _build_mock_group_info(group_id: str, match_id: str, status: str) -> dict:
    return {
        "group_id": group_id,
        "match_id": match_id,
        "activity_id": "",
        "plan_id": "",
        "group_name": "Nira 活动搭子小队",
        "members": [
            {"role": "me", "name": "你", "status": "accepted"},
            {"role": "partner", "name": "活动搭子", "status": "pending"},
            {"role": "assistant", "name": "Nira", "status": "online"},
        ],
        "welcome_message": "你们这次的见面已经安排好啦。先不用急着尬聊，Nira 给你们准备了几个轻松开场。",
        "icebreaker_questions": [
            "这次活动里你最想先试哪一部分？",
            "最近在城市里发现过什么还不错的小地方？",
            "如果这次还顺路加一站，你会选咖啡、书店还是散步？",
        ],
        "activity_summary": {
            "title": "待确认的轻量活动",
            "activity_type": "coffee_chat",
            "suggested_time": "本周末下午",
            "suggested_location": "交通方便的公共地点",
            "reason": "先用低压力的方式见一面，不把行程排太满。",
            "tips": ["公共地点见面", "节奏轻一点", "觉得合拍再顺路加一站"],
        },
        "status": status,
    }
