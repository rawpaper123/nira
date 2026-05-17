from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID

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
from app.services.match_service import (
    run_weekly_match,
    get_match_result,
    accept_match,
    reject_match,
    get_group_info,
    send_group_message,
    get_queue_status,
)

router = APIRouter(prefix="/api/v1/match", tags=["match"])


@router.post("/join-queue", response_model=JoinQueueResponse)
async def join_queue(req: JoinQueueRequest):
    """将用户加入本周匹配队列（MVP：本地内存队列）"""
    from app.services.match_service import add_to_queue

    result = add_to_queue(req.user_id, req.profile)
    return JoinQueueResponse(
        status=result["status"],
        queue_position=result["queue_position"],
        message=result["message"],
    )


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


@router.get("/queue/{user_id}")
async def queue_status(user_id: str):
    return get_queue_status(user_id)


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

    if not matches:
        return WeeklyMatchResponse(
            matches=[],
            week_number=result.get("week_number", 0),
            total_candidates=result.get("total_candidates", 0),
            status=result.get("status", "waiting"),
            message=result.get("message", "暂无匹配结果"),
        )

    match = matches[0]
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

    match_result = MatchResult(
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
        poster=match.get("poster"),
        poster_copy=match.get("poster_copy", ""),
        status=match.get("status", "matched"),
    )

    return WeeklyMatchResponse(
        matches=[match_result],
        week_number=result.get("week_number", 0),
        total_candidates=result.get("total_candidates", 0),
        status=result.get("status", "matched"),
        message=result.get("message", ""),
    )


# ---- 接受/拒绝/群聊 ----


class AcceptRequest(BaseModel):
    match_id: str = ""
    user_id: str = ""
    role: str = "a"  # 'a' or 'b'


class RejectRequest(BaseModel):
    match_id: str = ""
    user_id: str = ""


class GroupMessageRequest(BaseModel):
    group_id: str
    sender: str
    content: str


@router.post("/accept")
async def accept_match_endpoint(req: AcceptRequest):
    """接受匹配。先接受者创建群聊，双方都接受后群聊激活。"""
    if not req.match_id:
        return {"status": "missing_match", "group_id": "", "message": "缺少 match_id，暂时不能接受匹配"}
    if not req.user_id:
        return {"status": "missing_user", "group_id": "", "message": "缺少 user_id，暂时不能接受匹配"}
    result = accept_match(req.match_id, req.user_id, req.role)
    return result


@router.post("/reject")
async def reject_match_endpoint(req: RejectRequest):
    """拒绝匹配"""
    if not req.match_id:
        return {"status": "missing_match", "message": "缺少 match_id，暂时不能拒绝匹配"}
    return reject_match(req.match_id, req.user_id)


@router.get("/group/{group_id}")
async def get_group_endpoint(group_id: str):
    """获取群聊信息"""
    info = get_group_info(group_id)
    if not info:
        return {"error": "group not found"}
    return info


@router.post("/group/send")
async def send_group_msg_endpoint(req: GroupMessageRequest):
    """发送群聊消息"""
    msg = send_group_message(req.group_id, req.sender, req.content, is_me=True)
    return msg
