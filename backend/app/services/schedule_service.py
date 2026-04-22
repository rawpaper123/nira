from uuid import UUID, uuid4

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.scheduler_agent import generate_activity_plan
from app.models.user import Match, Activity, User, UserProfile


async def arrange_activity(
    db: AsyncSession,
    match_id: UUID,
) -> dict:
    result = await db.execute(select(Match).where(Match.id == match_id))
    match = result.scalar_one_or_none()
    if not match:
        raise ValueError(f"Match {match_id} not found")

    profile_a_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == match.user_a_id)
    )
    profile_a = profile_a_result.scalar_one_or_none()

    profile_b_result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == match.user_b_id)
    )
    profile_b = profile_b_result.scalar_one_or_none()

    if not profile_a or not profile_b:
        raise ValueError("One or both users lack a profile")

    pa = {
        "interests": profile_a.interests or [],
        "activity_types": profile_a.activity_types or [],
        "personality_tags": profile_a.personality_tags or [],
        "bio": profile_a.bio or "",
    }
    pb = {
        "interests": profile_b.interests or [],
        "activity_types": profile_b.activity_types or [],
        "personality_tags": profile_b.personality_tags or [],
        "bio": profile_b.bio or "",
    }

    compatibility = match.compatibility_detail or {"overall_score": match.score}

    user_a = (await db.execute(select(User).where(User.id == match.user_a_id))).scalar_one_or_none()
    city = user_a.city if user_a else None

    plan_result = await generate_activity_plan(pa, pb, compatibility, city)

    activity = Activity(
        id=uuid4(),
        match_id=match_id,
        title=plan_result["plan"]["title"],
        description=plan_result["plan"]["description"],
        activity_type=plan_result["plan"]["activity_type"],
        location=plan_result["plan"]["location"],
        suggested_time=plan_result["plan"]["suggested_time"],
        poster_url=None,
        chat_group_url=None,
        plan_detail=plan_result,
        status="planned",
    )
    db.add(activity)
    await db.flush()

    return {
        "activity_id": str(activity.id),
        "match_id": str(match_id),
        "plan": plan_result["plan"],
        "poster_copy": plan_result.get("poster_copy"),
        "group_welcome": plan_result.get("group_welcome"),
    }
