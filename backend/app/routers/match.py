from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.match import (
    JoinQueueRequest,
    JoinQueueResponse,
    WeeklyMatchRequest,
    WeeklyMatchResponse,
    MatchResult,
    CompatibilityDetail,
    SimulationScene,
)
from app.services.match_service import run_weekly_match

router = APIRouter(prefix="/api/v1/match", tags=["match"])


@router.post("/join-queue", response_model=JoinQueueResponse)
async def join_queue(req: JoinQueueRequest):
    """将用户加入本周匹配队列（MVP：本地内存队列）"""
    from app.services.match_service import add_to_queue

    position = add_to_queue(req.user_id, req.profile)
    return JoinQueueResponse(
        status="joined",
        queue_position=position,
        message=f"已加入本周匹配队列，当前队列第 {position} 位",
    )


@router.post("/weekly", response_model=WeeklyMatchResponse)
async def weekly_match(
    req: WeeklyMatchRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await run_weekly_match(db, req.user_id, req.city)

    simulation_scenes = [
        SimulationScene(
            scenario=s.get("scenario", ""),
            conversation_snippet=s.get("conversation_snippet", ""),
            vibe_score=s.get("vibe_score", 0.0),
        )
        for s in result["simulation"]
    ]

    compat = result["compatibility"]
    compatibility = CompatibilityDetail(
        overall_score=compat.get("overall_score", 0.0),
        interest_overlap=compat.get("interest_overlap", 0.0),
        personality_complement=compat.get("personality_complement", 0.0),
        schedule_compatibility=compat.get("schedule_compatibility", 0.0),
        reasoning=compat.get("reasoning", ""),
    )

    match_result = MatchResult(
        match_id=result["match_id"],
        user_b_id=result["user_b_id"],
        user_b_nickname=result.get("user_b_nickname"),
        user_b_avatar=result.get("user_b_avatar"),
        score=result["score"],
        simulation=simulation_scenes,
        compatibility=compatibility,
    )

    return WeeklyMatchResponse(
        matches=[match_result],
        week_number=result["week_number"],
        total_candidates=result["total_candidates"],
    )
