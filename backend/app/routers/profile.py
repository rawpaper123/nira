from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.profile import ProfileBuildRequest, ProfileBuildResponse
from app.services.profile_service import build_user_profile, get_user_profile, profile_to_response_data

router = APIRouter(prefix="/api/v1/profile", tags=["profile"])


@router.post("/build", response_model=ProfileBuildResponse)
async def build_profile(
    req: ProfileBuildRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        profile = await build_user_profile(db, req.user_id, req.raw_input)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e
    return ProfileBuildResponse(**profile_to_response_data(profile))


@router.get("/{user_id}", response_model=ProfileBuildResponse)
async def get_profile(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    profile = await get_user_profile(db, user_id)
    if not profile:
        raise HTTPException(status_code=404, detail="profile not found")
    return ProfileBuildResponse(**profile_to_response_data(profile))
