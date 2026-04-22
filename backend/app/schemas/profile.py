from uuid import UUID

from pydantic import BaseModel, Field


class ProfileBuildRequest(BaseModel):
    user_id: UUID
    raw_input: str = Field(..., description="用户的自由文本输入，描述兴趣、偏好等")


class InterestTag(BaseModel):
    tag: str
    weight: float = Field(default=1.0, ge=0.0, le=1.0)


class ProfileBuildResponse(BaseModel):
    user_id: UUID
    interests: list[str]
    activity_types: list[str]
    personality_tags: list[str]
    bio: str
    availability: dict


class UserProfileRead(BaseModel):
    user_id: UUID
    interests: list[str]
    activity_types: list[str]
    personality_tags: list[str]
    bio: str | None
    availability: dict

    model_config = {"from_attributes": True}
