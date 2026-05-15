from uuid import UUID

from pydantic import BaseModel, Field


class JoinQueueRequest(BaseModel):
    user_id: str
    profile: dict | None = None


class JoinQueueResponse(BaseModel):
    status: str
    queue_position: int
    message: str


class WeeklyMatchRequest(BaseModel):
    user_id: UUID
    city: str | None = None


class SimulationScene(BaseModel):
    scenario: str
    conversation_snippet: str
    vibe_score: float = Field(ge=0.0, le=1.0)


class CompatibilityDetail(BaseModel):
    overall_score: float = Field(ge=0.0, le=1.0)
    interest_overlap: float = Field(ge=0.0, le=1.0)
    personality_complement: float = Field(ge=0.0, le=1.0)
    schedule_compatibility: float = Field(ge=0.0, le=1.0)
    reasoning: str


class MatchResult(BaseModel):
    match_id: UUID
    user_b_id: UUID
    user_b_nickname: str | None
    user_b_avatar: str | None
    score: float
    simulation: list[SimulationScene]
    compatibility: CompatibilityDetail
    poster_url: str | None = None
    matched_user_name: str | None = None
    compatibility_score: int | None = None
    reasons: list[str] = Field(default_factory=list)
    suggested_activity: str | None = None
    status: str = "matched"


class WeeklyMatchResponse(BaseModel):
    matches: list[MatchResult]
    week_number: int
    total_candidates: int
    status: str = "matched"
    message: str = ""


class AcceptMatchRequest(BaseModel):
    match_id: str
    user_id: str
    role: str = "a"


class RejectMatchRequest(BaseModel):
    match_id: str
    user_id: str
