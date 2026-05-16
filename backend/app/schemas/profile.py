from uuid import UUID

from pydantic import BaseModel, Field


class ProfileBuildRequest(BaseModel):
    user_id: UUID
    raw_input: str = Field(..., description="用户的自由文本输入，描述兴趣、偏好等")


class ProfileChatRequest(BaseModel):
    user_id: UUID
    message: str = Field(..., min_length=1, description="User's natural-language onboarding chat message")
    conversation_id: str | None = None


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
    preferred_name: str = ""
    preferred_style: str = ""
    preferred_gender: str = "any"
    preferred_type: str = ""
    photo_urls: list[str] = Field(default_factory=list)
    photo_status: str = "pending"


class ProfileChatCompletion(BaseModel):
    is_ready: bool
    missing_fields: list[str]


class ProfileChatResponse(BaseModel):
    status: str = "ok"
    reply: str
    profile_patch: dict = Field(default_factory=dict)
    profile: dict
    completion: ProfileChatCompletion
    intent: str = "update_profile"
    conversation_id: str | None = None


class UserProfileRead(BaseModel):
    user_id: UUID
    interests: list[str]
    activity_types: list[str]
    personality_tags: list[str]
    bio: str | None
    availability: dict

    model_config = {"from_attributes": True}
