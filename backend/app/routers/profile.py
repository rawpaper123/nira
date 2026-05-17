from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.profile import ProfileBuildRequest, ProfileBuildResponse, ProfileChatRequest, ProfileChatResponse
from app.services.profile_service import (
    build_user_profile,
    chat_user_profile,
    get_user_profile,
    profile_completion_data,
    profile_to_response_data,
)

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


@router.post("/chat", response_model=ProfileChatResponse)
async def chat_profile(
    req: ProfileChatRequest,
    db: AsyncSession = Depends(get_db),
):
    try:
        return await chat_user_profile(
            db=db,
            user_id=req.user_id,
            message=req.message,
            conversation_id=req.conversation_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e)) from e


@router.get("/{user_id}")
async def get_profile(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    profile = await get_user_profile(db, user_id)
    if not profile:
        return {
            "user_id": user_id,
            "interests": [],
            "activity_types": [],
            "personality_tags": [],
            "bio": "",
            "availability": {},
            "preferred_name": "",
            "preferred_style": "",
            "preferred_gender": "any",
            "preferred_type": "",
            "photo_urls": [],
            "photo_status": "pending",
            "profile_completed": False,
            "status": "not_found",
            "message": "profile not found",
        }
    data = profile_to_response_data(profile)
    data["profile_completed"] = profile_completion_data(data)["is_ready"]
    data["status"] = "ok"
    return data
