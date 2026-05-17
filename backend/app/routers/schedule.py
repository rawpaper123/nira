import logging
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.schemas.schedule import ScheduleArrangeRequest, ScheduleArrangeResponse, ActivityPlan
from app.services.schedule_service import arrange_activity
from app.services.match_service import register_group_info
from app.agents.scheduler_agent import generate_activity_plan

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/schedule", tags=["schedule"])


@router.post("/arrange")
async def arrange_schedule(
    req: ScheduleArrangeRequest,
    db: AsyncSession = Depends(get_db),
):
    """生成活动方案。优先从数据库查找 match，找不到则走 AI 直接生成。"""
    try:
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
    except Exception as e:
        logger.warning("DB-based arrange failed: %s, falling back to AI-only", e)
        raise


class ArrangeSimpleRequest(BaseModel):
    """无需数据库的活动方案请求"""
    match_id: str | None = None
    profile_a: dict | None = None
    profile_b: dict | None = None
    compatibility: dict | None = None
    city: str = "上海"


class ArrangeSimpleResponse(BaseModel):
    activity_id: str
    match_id: str
    plan: dict
    title: str = ""
    activity_type: str = ""
    suggested_time: str = ""
    suggested_location: str = ""
    reason: str = ""
    tips: list[str] = []
    poster_copy: str = ""
    group_welcome: str = ""
    status: str = "planned"


class ScheduleConfirmRequest(BaseModel):
    match_id: str | None = None
    activity_id: str | None = None
    plan_id: str | None = None
    plan: dict | None = None
    group_welcome: str | None = None
    members: list[dict] | None = None


class ScheduleConfirmResponse(BaseModel):
    group_id: str
    match_id: str
    activity_id: str = ""
    plan_id: str = ""
    group_name: str = ""
    members: list[dict] = []
    welcome_message: str = ""
    icebreaker_questions: list[str] = []
    activity_summary: dict = {}
    status: str = "group_created"
    messages: list[dict] = []


@router.post("/arrange-simple", response_model=ArrangeSimpleResponse)
async def arrange_simple(req: ArrangeSimpleRequest):
    """轻量版：不需要数据库，直接生成活动方案。

    前端在 match 页面拿到匹配数据后，把 profile_a/profile_b/compatibility 传过来。
    """
    if not req.match_id:
        return ArrangeSimpleResponse(
            activity_id=f"plan-{uuid4().hex[:12]}",
            match_id="",
            plan={},
            status="missing_match",
            poster_copy="",
            group_welcome="还没拿到匹配结果，先等 Nira 把搭子安排好～",
        )

    profile_a = req.profile_a or {
        "interests": ["户外运动"],
        "activity_types": ["hiking"],
        "personality_tags": ["extrovert"],
        "bio": "热情开朗",
    }
    profile_b = req.profile_b or {
        "interests": ["看展"],
        "activity_types": ["exhibition"],
        "personality_tags": ["introvert", "artsy"],
        "bio": "文艺范",
    }
    compatibility = req.compatibility or {"overall_score": 0.75}

    if settings.app_env == "development":
        result = _mock_activity_plan(profile_a, profile_b, compatibility, req.city)
    else:
        result = await generate_activity_plan(profile_a, profile_b, compatibility, req.city)

    plan = result.get("plan", {})
    return ArrangeSimpleResponse(
        activity_id=f"plan-{uuid4().hex[:12]}",
        match_id=req.match_id,
        plan=plan,
        title=plan.get("title", ""),
        activity_type=plan.get("activity_type", ""),
        suggested_time=plan.get("suggested_time", ""),
        suggested_location=plan.get("suggested_location") or plan.get("location", ""),
        reason=plan.get("reason", ""),
        tips=plan.get("tips", []),
        poster_copy=result.get("poster_copy", ""),
        group_welcome=result.get("group_welcome", ""),
        status="planned",
    )


@router.post("/confirm", response_model=ScheduleConfirmResponse)
async def confirm_schedule(req: ScheduleConfirmRequest):
    """Confirm a mock activity plan and create a local mock group.

    Development baseline only: no real IM, WeChat group, map, calendar, or LLM call.
    """
    if not req.match_id:
        return ScheduleConfirmResponse(
            group_id="",
            match_id="",
            status="missing_match",
            group_name="Nira 活动搭子小队",
            welcome_message="还没有拿到匹配结果，等 Nira 先把活动搭子安排好。",
        )

    plan = req.plan or {}
    activity_id = req.activity_id or req.plan_id or f"plan-{uuid4().hex[:12]}"
    group_id = f"group-{req.match_id[:8]}-{uuid4().hex[:6]}"
    activity_summary = {
        "title": plan.get("title") or "轻量活动安排",
        "activity_type": plan.get("activity_type") or "coffee_chat",
        "suggested_time": plan.get("suggested_time") or "本周末下午",
        "suggested_location": plan.get("suggested_location") or plan.get("location") or "交通方便的公共地点",
        "reason": plan.get("reason") or plan.get("description") or "先用低压力的方式见一面，不把行程排太满。",
        "tips": plan.get("tips") or ["公共地点见面", "节奏轻一点", "觉得合拍再顺路加一站"],
    }
    members = req.members or [
        {"role": "me", "name": "你", "status": "accepted"},
        {"role": "partner", "name": "活动搭子", "status": "invited"},
        {"role": "assistant", "name": "Nira", "status": "online"},
    ]
    welcome = (
        req.group_welcome
        or "你们这次的见面已经安排好啦。先不用急着尬聊，Nira 给你们准备了几个轻松开场。"
    )
    info = {
        "group_id": group_id,
        "match_id": req.match_id,
        "activity_id": activity_id,
        "plan_id": activity_id,
        "group_name": "Nira 活动搭子小队",
        "members": members,
        "welcome_message": welcome,
        "icebreaker_questions": [
            "这次活动里你最想先试哪一部分？",
            "最近在城市里发现过什么还不错的小地方？",
            "如果这次还顺路加一站，你会选咖啡、书店还是散步？",
        ],
        "activity_summary": activity_summary,
        "status": "group_created",
        "messages": [
            {
                "id": "system-confirmed",
                "sender": "Nira",
                "content": welcome,
                "isSystem": True,
                "time": "现在",
            }
        ],
    }
    register_group_info(info)
    return ScheduleConfirmResponse(**info)


def _mock_activity_plan(profile_a: dict, profile_b: dict, compatibility: dict, city: str) -> dict:
    activity_type = _pick_activity_type(profile_a, profile_b)
    activity_map = {
        "exhibition": ("低压力看展局", "看展 + 附近散步", "西岸美术馆周边"),
        "city_walk": ("城市随便走走局", "Citywalk", "武康路到安福路一带"),
        "hiking": ("轻徒步呼吸一下", "公园散步", "世纪公园"),
        "sports": ("轻运动搭子局", "运动局", "社区运动中心"),
        "board_game": ("不尬桌游局", "桌游", "静安寺附近桌游店"),
        "movie": ("看完能聊两句的电影局", "电影", "市中心交通方便的影院"),
        "coffee_chat": ("咖啡散步 90 分钟", "咖啡散步", "愚园路附近咖啡店"),
    }
    title, label, location = activity_map.get(activity_type, activity_map["coffee_chat"])
    name_a = profile_a.get("preferred_name") or "你"
    name_b = profile_b.get("preferred_name") or "新搭子"
    reason = compatibility.get("reasoning") or f"{name_a} 和 {name_b} 可以从一个低压力的{label}开始，不用硬聊，边走边熟。"

    plan = {
        "title": title,
        "description": f"一次轻量的{label}，节奏不用太满，适合第一次见面先确认气场。",
        "activity_type": activity_type,
        "location": f"{city or '上海'} · {location}",
        "suggested_location": f"{city or '上海'} · {location}",
        "suggested_time": "本周六下午 3:00",
        "duration": "1.5-2 小时",
        "reason": reason,
        "status": "planned",
        "tips": [
            "第一次见面就选公共场所，轻松一点更好聊",
            "不用把行程排太满，留点随机散步的空间",
            "如果感觉不错，再顺手加一站书店或小吃店",
        ],
    }
    return {
        "plan": plan,
        "poster_copy": f"{label}走起，轻松见一面，不尬聊也能有话题。",
        "group_welcome": f"来来来，{name_a} 和 {name_b} 先认识一下～这次给你们安排的是{label}，低压力开局，刚刚好。",
    }


def _pick_activity_type(profile_a: dict, profile_b: dict) -> str:
    valid_types = {
        "hiking",
        "coffee_chat",
        "sports",
        "exhibition",
        "movie",
        "board_game",
        "city_walk",
    }
    a_types = [t for t in (profile_a.get("activity_types") or []) if t in valid_types]
    b_types = [t for t in (profile_b.get("activity_types") or []) if t in valid_types]
    for activity_type in a_types:
        if activity_type in b_types:
            return activity_type
    return (a_types or b_types or ["coffee_chat"])[0]
