from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.profile import ProfileBuildRequest, ProfileBuildResponse
from app.services.profile_service import build_user_profile

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])


@router.post("/build", response_model=ProfileBuildResponse)
async def build_profile(
    req: ProfileBuildRequest,
    db: AsyncSession = Depends(get_db),
):
    profile = await build_user_profile(db, req.user_id, req.raw_input)
    return ProfileBuildResponse(
        user_id=profile.user_id,
        interests=profile.interests or [],
        activity_types=profile.activity_types or [],
        personality_tags=profile.personality_tags or [],
        bio=profile.bio or "",
        availability=profile.availability or {},
    )
