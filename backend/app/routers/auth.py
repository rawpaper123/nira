import hashlib
import logging
import re

import httpx
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from redis import asyncio as aioredis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_redis
from app.models.user import User
from app.services import auth_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

PHONE_RE = re.compile(r"^1\d{10}$")


# ---- wx.login ----

class LoginRequest(BaseModel):
    code: str


class LoginResponse(BaseModel):
    openid: str
    user_id: str


@router.post("/login", response_model=LoginResponse)
async def wx_login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    if not settings.wx_appid or settings.wx_appid == "test":
        mock_openid = f"dev_{hashlib.md5(req.code.encode()).hexdigest()[:16]}"
        return LoginResponse(openid=mock_openid, user_id=mock_openid)

    url = "https://api.weixin.qq.com/sns/jscode2session"
    params = {
        "appid": settings.wx_appid,
        "secret": settings.wx_secret,
        "js_code": req.code,
        "grant_type": "authorization_code",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(url, params=params)
        data = resp.json()

    openid = data.get("openid")
    if not openid:
        logger.error("jscode2session failed: %s", data)
        return LoginResponse(openid=f"err_{req.code[:8]}", user_id=f"err_{req.code[:8]}")

    user_id = hashlib.md5(openid.encode()).hexdigest()[:16]
    return LoginResponse(openid=openid, user_id=user_id)


# ---- Send verification code ----

class SendCodeRequest(BaseModel):
    phone: str


@router.post("/send-verification-code")
async def send_verification_code(req: SendCodeRequest, redis: aioredis.Redis = Depends(get_redis)):
    if not PHONE_RE.match(req.phone):
        return {"success": False, "detail": "手机号格式不正确"}

    code = auth_service.DEV_VERIFICATION_CODE if settings.app_env == "development" else auth_service.generate_code()

    try:
        await auth_service.store_code(redis, req.phone, code)
    except ValueError as e:
        return {"success": False, "detail": str(e)}
    except Exception as e:
        if settings.app_env != "development":
            raise
        logger.warning("Redis unavailable, using development verification code: %s", e)

    # TODO: 接入真实短信服务
    logger.info("[SMS] phone=%s code=%s", req.phone, code)

    detail = "开发环境验证码为 123456" if settings.app_env == "development" else "验证码已发送"
    return {"success": True, "detail": detail}


# ---- Invite code validation ----

class ValidateInviteRequest(BaseModel):
    invite_code: str


@router.post("/validate-invite-code")
async def validate_invite_code(req: ValidateInviteRequest, db: AsyncSession = Depends(get_db)):
    ok, msg = await auth_service.validate_invite_code(db, req.invite_code)
    return {"success": ok, "detail": msg}


# ---- Phone login with invite code ----

class VerifyCodeRequest(BaseModel):
    phone: str
    code: str
    openid: str = ""
    invite_code: str = ""


class VerifyCodeResponse(BaseModel):
    success: bool
    detail: str = ""
    openid: str = ""
    user_id: str = ""
    invite_code: str = ""
    token: str = ""


@router.post("/verify-code-and-login", response_model=VerifyCodeResponse)
async def verify_code_and_login(
    req: VerifyCodeRequest,
    redis: aioredis.Redis = Depends(get_redis),
    db: AsyncSession = Depends(get_db),
):
    if not PHONE_RE.match(req.phone):
        return VerifyCodeResponse(success=False, detail="手机号格式不正确")

    ok = await auth_service.verify_code(redis, req.phone, req.code)
    if not ok:
        return VerifyCodeResponse(success=False, detail="验证码错误或已过期")

    openid = req.openid or f"phone_{hashlib.md5(req.phone.encode()).hexdigest()[:16]}"

    # Check if user already exists (skip invite code check)
    result = await db.execute(select(User).where(User.phone == req.phone))
    existing_user = result.scalar_one_or_none()

    if existing_user:
        if openid and existing_user.openid != openid:
            existing_user.openid = openid

        token = hashlib.sha256(
            f"{existing_user.openid}:{existing_user.id}:{settings.secret_key}".encode()
        ).hexdigest()

        return VerifyCodeResponse(
            success=True,
            detail="登录成功",
            openid=existing_user.openid,
            user_id=str(existing_user.id),
            invite_code=existing_user.invite_code,
            token=token,
        )

    # New user — validate invite code
    if not req.invite_code:
        return VerifyCodeResponse(success=False, detail="新用户需输入邀请码")

    invite_ok, invite_msg = await auth_service.validate_invite_code(db, req.invite_code)
    if not invite_ok:
        return VerifyCodeResponse(success=False, detail=invite_msg)

    # Create user
    user = await auth_service.create_or_get_user(db, req.phone, openid)

    token = hashlib.sha256(
        f"{user.openid}:{user.id}:{settings.secret_key}".encode()
    ).hexdigest()

    logger.info("New user registered: phone=%s invite_code=%s", req.phone, user.invite_code)

    return VerifyCodeResponse(
        success=True,
        detail="注册成功",
        openid=user.openid,
        user_id=str(user.id),
        invite_code=user.invite_code,
        token=token,
    )
