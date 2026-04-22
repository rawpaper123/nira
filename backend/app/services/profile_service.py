from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.profile_agent import build_profile, build_profile_from_answers
from app.models.user import User, UserProfile


async def build_user_profile(
    db: AsyncSession,
    user_id: UUID,
    raw_input: str,
) -> UserProfile:
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise ValueError(f"User {user_id} not found")

    profile_data = await build_profile(raw_input)

    existing = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = existing.scalar_one_or_none()

    if profile:
        for key in ("interests", "activity_types", "personality_tags", "bio", "availability"):
            if key in profile_data:
                setattr(profile, key, profile_data[key])
    else:
        profile = UserProfile(
            user_id=user_id,
            interests=profile_data.get("interests", []),
            activity_types=profile_data.get("activity_types", []),
            personality_tags=profile_data.get("personality_tags", []),
            bio=profile_data.get("bio", ""),
            availability=profile_data.get("availability", {}),
        )
        db.add(profile)

    await db.flush()
    return profile
