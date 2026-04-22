from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.schedule import ScheduleArrangeRequest, ScheduleArrangeResponse, ActivityPlan
from app.services.schedule_service import arrange_activity

router = APIRouter(prefix="/api/v1/schedule", tags=["schedule"])


@router.post("/arrange", response_model=ScheduleArrangeResponse)
async def arrange_schedule(
    req: ScheduleArrangeRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await arrange_activity(db, req.match_id)

    plan = result["plan"]
    activity_plan = ActivityPlan(
        title=plan["title"],
        description=plan["description"],
        activity_type=plan["activity_type"],
        location=plan["location"],
        suggested_time=plan["suggested_time"],
        duration=plan.get("duration", "2小时"),
        tips=plan.get("tips", []),
    )

    return ScheduleArrangeResponse(
        activity_id=result["activity_id"],
        match_id=result["match_id"],
        plan=activity_plan,
        chat_group_qrcode=result.get("group_welcome"),
    )
