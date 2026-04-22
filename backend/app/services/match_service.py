import datetime
from uuid import UUID, uuid4

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.compatibility_agent import evaluate_compatibility
from app.agents.orchestrator import orchestrator_graph
from app.agents.simulation_agent import simulate_interaction
from app.models.user import User, UserProfile, Match

# ---- 匹配队列（MVP：内存队列） ----
_match_queue: list[dict] = []


def add_to_queue(user_id: str, profile: dict | None = None) -> int:
    """加入匹配队列，返回队列位置"""
    global _match_queue

    # 避免重复加入
    for item in _match_queue:
        if item["user_id"] == user_id:
            return _match_queue.index(item) + 1

    _match_queue.append({
        "user_id": user_id,
        "profile": profile,
        "joined_at": datetime.datetime.now().isoformat(),
    })
    return len(_match_queue)


def get_queue() -> list[dict]:
    return _match_queue


def clear_queue():
    global _match_queue
    _match_queue = []


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

    return {
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
