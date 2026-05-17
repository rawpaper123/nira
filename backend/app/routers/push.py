from __future__ import annotations

import logging

from fastapi import APIRouter
from pydantic import BaseModel

from app.core.config import settings
from app.services.push_service import (
    get_access_token,
    get_all_subscribed,
    get_subscription,
    push_match_result,
    record_subscription,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/push", tags=["push"])


class SubscribeRequest(BaseModel):
    user_id: str
    openid: str | None = None
    template_id: str | None = None


class SubscribeResponse(BaseModel):
    status: str
    message: str


class MatchPushRequest(BaseModel):
    user_id: str
    match_id: str
    score: int = 85
    nickname: str = "activity partner"
    openid: str | None = None
    page: str | None = None


class MatchPushResponse(BaseModel):
    status: str
    message: str
    detail: dict | None = None


class TestMatchPushRequest(BaseModel):
    openid: str = ""
    match_id: str = "test-match-001"
    score: int = 88
    nickname: str = "Nira partner"
    page: str | None = None


class TestMatchPushResponse(BaseModel):
    status: str
    message: str
    detail: dict | None = None
    debug_info: dict | None = None


class TestPushRequest(BaseModel):
    openid: str = ""


class TestPushResponse(BaseModel):
    status: str
    message: str
    detail: dict | None = None


@router.post("/subscribe", response_model=SubscribeResponse)
async def subscribe_notification(req: SubscribeRequest):
    """Record that a user allowed match-result notifications."""
    if not req.user_id:
        return SubscribeResponse(status="missing_user", message="user_id is required")

    record_subscription(req.user_id, req.openid, req.template_id)
    return SubscribeResponse(status="ok", message="subscription recorded")


@router.get("/subscription/{user_id}")
async def check_subscription(user_id: str):
    """Read a user's local subscription status."""
    sub = get_subscription(user_id)
    return {
        "status": "ok",
        "subscribed": sub is not None and sub.get("subscribed", False),
        "subscription": sub,
    }


@router.get("/subscribers")
async def list_subscribers():
    """List locally subscribed users for development/debugging."""
    subscribers = get_all_subscribed()
    return {"status": "ok", "subscribers": subscribers, "total": len(subscribers)}


@router.post("/match-result", response_model=MatchPushResponse)
async def send_match_result_push(req: MatchPushRequest):
    """Send or mock a match-result push notification."""
    if not req.openid:
        return MatchPushResponse(
            status="mocked",
            message="openid missing; recorded as development mock only",
            detail={"user_id": req.user_id, "match_id": req.match_id},
        )

    try:
        result = await push_match_result(
            openid=req.openid,
            match_id=req.match_id,
            score=req.score,
            nickname=req.nickname,
            page=req.page,
        )
        return MatchPushResponse(status="ok", message="push sent", detail=result)
    except Exception as exc:
        logger.warning("match-result push failed: %s", exc)
        if settings.app_env == "development":
            return MatchPushResponse(
                status="mocked",
                message=f"push mocked in development: {exc}",
                detail={"user_id": req.user_id, "match_id": req.match_id},
            )
        return MatchPushResponse(status="error", message=f"push failed: {exc}")


@router.post("/test-match-result", response_model=TestMatchPushResponse)
async def test_send_match_push(req: TestMatchPushRequest):
    """Development test endpoint for match-result notifications.

    In development, missing WeChat credentials fall back to a mock response so
    local demo flows never depend on production WeChat services.
    """
    debug_info = {
        "openid_prefix": (req.openid[:8] + "...") if req.openid else "",
        "match_id": req.match_id,
        "target_page": req.page or f"pages/match/match?from=push&match_id={req.match_id}",
        "app_env": settings.app_env,
    }

    if not req.openid:
        return TestMatchPushResponse(
            status="mocked",
            message="openid missing; test push mocked",
            debug_info=debug_info,
        )

    try:
        result = await push_match_result(
            openid=req.openid,
            match_id=req.match_id,
            score=req.score,
            nickname=req.nickname,
            page=req.page,
        )
        return TestMatchPushResponse(
            status="ok",
            message="test push sent",
            detail=result,
            debug_info=debug_info,
        )
    except Exception as exc:
        logger.warning("test match push failed: %s", exc)
        if settings.app_env == "development":
            return TestMatchPushResponse(
                status="mocked",
                message=f"test push mocked in development: {exc}",
                debug_info=debug_info,
            )
        return TestMatchPushResponse(
            status="error",
            message=f"test push failed: {exc}",
            debug_info=debug_info,
        )


@router.post("/test", response_model=TestPushResponse)
async def test_push(req: TestPushRequest):
    """Check WeChat push configuration without blocking local development."""
    if settings.app_env == "development" and (
        not req.openid or not settings.wx_appid or not settings.wx_secret or not settings.wx_template_id_match
    ):
        return TestPushResponse(
            status="mocked",
            message="development mock: WeChat credentials/template are not fully configured",
            detail={
                "has_openid": bool(req.openid),
                "has_wx_appid": bool(settings.wx_appid),
                "has_wx_secret": bool(settings.wx_secret),
                "has_template": bool(settings.wx_template_id_match),
            },
        )

    try:
        token = await get_access_token()
        result = await push_match_result(
            openid=req.openid,
            match_id="test-push",
            score=99,
            nickname="test partner",
        )
        return TestPushResponse(
            status="ok",
            message="test push sent",
            detail={"access_token_prefix": token[:10] + "...", "wx_response": result},
        )
    except Exception as exc:
        logger.warning("generic test push failed: %s", exc)
        if settings.app_env == "development":
            return TestPushResponse(
                status="mocked",
                message=f"test push mocked in development: {exc}",
            )
        return TestPushResponse(status="error", message=f"test push failed: {exc}")
