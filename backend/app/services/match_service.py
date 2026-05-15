import datetime
from uuid import UUID, uuid4

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.compatibility_agent import evaluate_compatibility
from app.agents.simulation_agent import simulate_interaction
from app.core.config import settings
from app.models.user import Match, User, UserProfile

# ---- 匹配队列（MVP：内存队列） ----
_match_queue: list[dict] = []
_mock_match_results: dict[str, dict] = {}
_match_accepts: dict[str, dict] = {}


def _current_week_number() -> int:
    now = datetime.datetime.now()
    return int(now.strftime("%Y%W"))


async def add_to_queue(db: AsyncSession, user_id: str, profile: dict | None = None) -> dict:
    """加入匹配队列，返回稳定队列状态。"""
    try:
        user_uuid = UUID(str(user_id))
    except ValueError:
        return {"status": "invalid_user", "queue_position": 0, "message": "用户 ID 无效"}

    user_result = await db.execute(select(User).where(User.id == user_uuid))
    user = user_result.scalar_one_or_none()
    if not user:
        return {"status": "user_not_found", "queue_position": 0, "message": "用户不存在，请先登录"}

    profile_result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_uuid))
    db_profile = profile_result.scalar_one_or_none()
    if not db_profile and not _profile_is_complete(profile):
        return {"status": "profile_required", "queue_position": 0, "message": "请先完成画像，再加入本周匹配队列"}

    profile_snapshot = profile or _profile_to_dict(db_profile)
    for index, item in enumerate(_match_queue):
        if item["user_id"] == str(user_uuid):
            item["profile"] = profile_snapshot
            return {
                "status": "already_joined",
                "queue_position": index + 1,
                "message": f"你已经在本周匹配队列中，当前队列第 {index + 1} 位",
            }

    _match_queue.append({
        "user_id": str(user_uuid),
        "profile": profile_snapshot,
        "joined_at": datetime.datetime.now().isoformat(),
    })
    position = len(_match_queue)
    return {"status": "joined", "queue_position": position, "message": f"已加入本周匹配队列，当前队列第 {position} 位"}


def get_queue() -> list[dict]:
    return _match_queue


def clear_queue():
    global _match_queue
    _match_queue = []


def get_queue_status(user_id: str) -> dict:
    for index, item in enumerate(_match_queue):
        if item["user_id"] == str(user_id):
            return {
                "status": "queued",
                "queue_position": index + 1,
                "message": "已加入本周匹配队列，周三 19:00 揭晓结果",
            }
    return {"status": "not_joined", "queue_position": 0, "message": "还没有加入本周匹配队列"}


async def run_weekly_match(
    db: AsyncSession,
    user_id: UUID,
    city: str | None = None,
) -> dict:
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalar_one_or_none()
    if not profile:
        return _empty_match_result("profile_required", "请先完成画像，再进行匹配")

    week = _current_week_number()

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

    if settings.app_env == "development":
        return await _run_development_match(db, user_id, profile, week)

    candidates = await db.execute(
        select(UserProfile).where(UserProfile.user_id != user_id).limit(20)
    )
    candidate_profiles = candidates.scalars().all()
    if not candidate_profiles:
        return _empty_match_result("waiting", "暂无候选用户，请等待更多用户加入")

    profile_a = _profile_to_dict(profile)
    best_match = None
    best_score = 0.0
    best_simulation = None
    best_compatibility = None

    for candidate in candidate_profiles[:5]:
        profile_b = _profile_to_dict(candidate)
        simulation = await simulate_interaction(profile_a, profile_b)
        compatibility = await evaluate_compatibility(profile_a, profile_b, simulation)
        score = compatibility.get("overall_score", 0.0)

        if score > best_score:
            best_score = score
            best_match = candidate
            best_simulation = simulation
            best_compatibility = compatibility

    if not best_match:
        return _empty_match_result("waiting", "暂无合适匹配，请等待下一轮")

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
    return await _match_record_to_result(db, match_record)


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
    if queue_status["status"] == "queued":
        return _empty_match_result("waiting", queue_status["message"], total_candidates=max(0, len(_match_queue) - 1))
    return _empty_match_result("not_joined", queue_status["message"])


async def _run_development_match(
    db: AsyncSession,
    user_id: UUID,
    profile: UserProfile,
    week: int,
) -> dict:
    candidates = await db.execute(select(UserProfile).where(UserProfile.user_id != user_id).limit(5))
    candidate_profiles = candidates.scalars().all()
    if candidate_profiles:
        candidate = candidate_profiles[0]
        result = _build_mock_match_result(str(user_id), _profile_to_dict(profile), str(candidate.user_id), _profile_to_dict(candidate), week)
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

    queued_candidate = _first_queue_candidate(str(user_id))
    if queued_candidate:
        result = _build_mock_match_result(
            str(user_id),
            _profile_to_dict(profile),
            queued_candidate["user_id"],
            queued_candidate.get("profile") or {},
            week,
        )
        _mock_match_results[str(user_id)] = result
        return result

    queue_status = get_queue_status(str(user_id))
    if queue_status["status"] == "queued":
        return _empty_match_result("waiting", "已在队列中，暂无候选用户", total_candidates=0)
    return _empty_match_result("not_joined", "还没有加入本周匹配队列")


async def _match_record_to_result(db: AsyncSession, match: Match) -> dict:
    user_b_result = await db.execute(select(User).where(User.id == match.user_b_id))
    user_b = user_b_result.scalar_one_or_none()
    profile_b_result = await db.execute(select(UserProfile).where(UserProfile.user_id == match.user_b_id))
    profile_b = profile_b_result.scalar_one_or_none()
    return _build_mock_match_result(
        str(match.user_a_id),
        {},
        str(match.user_b_id),
        _profile_to_dict(profile_b),
        match.week_number,
        match_id=str(match.id),
        score=match.score,
        compatibility=match.compatibility_detail,
        simulation=match.simulation_result.get("scenes", []) if match.simulation_result else [],
        nickname=user_b.nickname if user_b else None,
        avatar=user_b.avatar_url if user_b else None,
    )


def accept_match(match_id: str, user_id: str, role: str = "a") -> dict:
    if not match_id:
        return {"status": "missing_match", "message": "缺少 match_id，暂时不能接受匹配"}
    if not user_id:
        return {"status": "missing_user", "message": "缺少 user_id，暂时不能接受匹配"}

    state = _match_accepts.setdefault(match_id, {"accepted_users": set(), "rejected_users": set()})
    if user_id in state["rejected_users"]:
        return {"status": "already_rejected", "message": "你已经拒绝过这次匹配"}
    if user_id in state["accepted_users"]:
        return {"status": "already_accepted", "message": "你已经接受过这次匹配"}

    state["accepted_users"].add(user_id)
    status = "accepted_both" if len(state["accepted_users"]) >= 2 else "accepted_first"
    return {"status": status, "match_id": match_id, "message": "已接受匹配"}


def reject_match(match_id: str, user_id: str) -> dict:
    if not match_id:
        return {"status": "missing_match", "message": "缺少 match_id，暂时不能拒绝匹配"}
    state = _match_accepts.setdefault(match_id, {"accepted_users": set(), "rejected_users": set()})
    if user_id:
        state["rejected_users"].add(user_id)
        state["accepted_users"].discard(user_id)
    return {"status": "rejected", "match_id": match_id, "message": "已拒绝匹配"}


def _profile_to_dict(profile: UserProfile | dict | None) -> dict:
    if not profile:
        return {}
    if isinstance(profile, dict):
        return profile
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


def _first_queue_candidate(user_id: str) -> dict | None:
    for item in _match_queue:
        if item["user_id"] != user_id and _profile_is_complete(item.get("profile")):
            return item
    return None


def _empty_match_result(status: str, message: str, total_candidates: int = 0) -> dict:
    return {
        "matches": [],
        "week_number": _current_week_number(),
        "total_candidates": total_candidates,
        "status": status,
        "message": message,
    }


def _build_mock_match_result(
    user_a_id: str,
    profile_a: dict,
    user_b_id: str,
    profile_b: dict,
    week: int,
    match_id: str | None = None,
    score: float = 0.86,
    compatibility: dict | None = None,
    simulation: list[dict] | None = None,
    nickname: str | None = None,
    avatar: str | None = None,
) -> dict:
    activity = _suggest_activity(profile_b)
    display_name = nickname or profile_b.get("availability", {}).get("preferred_name") or "Nira 活动搭子"
    compatibility = compatibility or {
        "overall_score": score,
        "interest_overlap": 0.82,
        "personality_complement": 0.78,
        "schedule_compatibility": 0.76,
        "chemistry_from_sim": 0.88,
        "reasoning": f"你们都适合从{activity}这种轻松活动开始，节奏比较舒服。",
    }
    simulation = simulation or [
        {
            "scenario": f"周末下午约去{activity}",
            "conversation_snippet": "A: 这个安排可以诶，不用太赶\nB: 对，我也喜欢轻松点的局\nA: 那就边逛边聊？\nB: 稳的，感觉不会尬",
            "vibe_score": 0.86,
        }
    ]
    return {
        "matches": [
            {
                "match_id": match_id or str(uuid4()),
                "user_b_id": user_b_id,
                "user_b_nickname": display_name,
                "user_b_avatar": avatar,
                "score": score,
                "simulation": simulation,
                "compatibility": compatibility,
                "matched_user_name": display_name,
                "compatibility_score": round(score * 100),
                "reasons": [compatibility.get("reasoning", "你们的兴趣和时间节奏比较搭。")],
                "suggested_activity": activity,
                "status": "matched",
            }
        ],
        "week_number": week,
        "total_candidates": 1,
        "status": "matched",
        "message": "development mock match ready",
    }


def _suggest_activity(profile: dict) -> str:
    activities = profile.get("activity_types") or []
    if "exhibition" in activities:
        return "看展 + city walk"
    if "hiking" in activities:
        return "轻徒步"
    if "sports" in activities:
        return "运动局"
    if "board_game" in activities:
        return "桌游局"
    return "咖啡聊天"
