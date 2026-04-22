from uuid import UUID

from pydantic import BaseModel, Field


class ScheduleArrangeRequest(BaseModel):
    match_id: UUID


class ActivityPlan(BaseModel):
    title: str
    description: str
    activity_type: str
    location: str
    suggested_time: str
    duration: str
    tips: list[str]


class ScheduleArrangeResponse(BaseModel):
    activity_id: UUID
    match_id: UUID
    plan: ActivityPlan
    poster_url: str | None = None
    chat_group_qrcode: str | None = None
