from uuid import UUID

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.schemas.match import (
    AcceptMatchRequest,
    JoinQueueRequest,
    JoinQueueResponse,
    RejectMatchRequest,
    WeeklyMatchRequest,
    WeeklyMatchResponse,
    MatchResult,
    CompatibilityDetail,
    SimulationScene,
)
from app.services.match_service import (
    accept_match,
    add_to_queue,
    get_match_result,
    reject_match,
    run_weekly_match,
)

router = APIRouter(prefix="/api/v1/match", tags=["match"])


@router.post("/join-queue", response_model=JoinQueueResponse)
async def join_queue(
    req: JoinQueueRequest,
    db: AsyncSession = Depends(get_db),
):
    """将用户加入本周匹配队列（MVP：内存队列）"""
    result = await add_to_queue(db, req.user_id, req.profile)
    return JoinQueueResponse(**result)


@router.post("/weekly", response_model=WeeklyMatchResponse)
async def weekly_match(
    req: WeeklyMatchRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await run_weekly_match(db, req.user_id, req.city)
    return _weekly_response_from_result(result)


@router.get("/result/{user_id}", response_model=WeeklyMatchResponse)
async def match_result(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    result = await get_match_result(db, user_id)
    return _weekly_response_from_result(result)


@router.post("/accept")
async def accept_match_endpoint(req: AcceptMatchRequest):
    return accept_match(req.match_id, req.user_id, req.role)


@router.post("/reject")
async def reject_match_endpoint(req: RejectMatchRequest):
    return reject_match(req.match_id, req.user_id)


def _weekly_response_from_result(result: dict) -> WeeklyMatchResponse:
    matches = result.get("matches") or []
    if not matches and result.get("match_id"):
        matches = [{
            "match_id": result["match_id"],
            "user_b_id": result["user_b_id"],
            "user_b_nickname": result.get("user_b_nickname"),
            "user_b_avatar": result.get("user_b_avatar"),
            "score": result["score"],
            "simulation": result.get("simulation", []),
            "compatibility": result.get("compatibility", {}),
        }]

    match_results = []
    for match in matches:
        simulation_scenes = [
            SimulationScene(
                scenario=s.get("scenario", ""),
                conversation_snippet=s.get("conversation_snippet", ""),
                vibe_score=s.get("vibe_score", 0.0),
            )
            for s in match.get("simulation", [])
        ]

        compat = match.get("compatibility", {})
        compatibility = CompatibilityDetail(
            overall_score=compat.get("overall_score", 0.0),
            interest_overlap=compat.get("interest_overlap", 0.0),
            personality_complement=compat.get("personality_complement", 0.0),
            schedule_compatibility=compat.get("schedule_compatibility", 0.0),
            reasoning=compat.get("reasoning", ""),
        )

        match_results.append(MatchResult(
            match_id=match["match_id"],
            user_b_id=match["user_b_id"],
            user_b_nickname=match.get("user_b_nickname"),
            user_b_avatar=match.get("user_b_avatar"),
            score=match["score"],
            simulation=simulation_scenes,
            compatibility=compatibility,
            matched_user_name=match.get("matched_user_name"),
            compatibility_score=match.get("compatibility_score"),
            reasons=match.get("reasons", []),
            suggested_activity=match.get("suggested_activity"),
            status=match.get("status", "matched"),
        ))

    return WeeklyMatchResponse(
        matches=match_results,
        week_number=result.get("week_number", 0),
        total_candidates=result.get("total_candidates", 0),
        status=result.get("status", "waiting" if not match_results else "matched"),
        message=result.get("message", ""),
    )
