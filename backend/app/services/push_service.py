"""WeChat subscription-message push baseline for local MVP demos.

The service keeps subscription state in a small JSON file so development does
not require database writes or real WeChat credentials. Real WeChat calls are
only attempted when openid, app credentials, and template id are present.
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

_token_cache: dict[str, Any] = {"token": "", "expires_at": 0}
_subscriptions: dict[str, dict] = {}

_DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
_SUBSCRIPTIONS_FILE = os.path.join(_DATA_DIR, "subscriptions.json")


async def get_access_token() -> str:
    """Get a WeChat access token with an in-memory development cache."""
    if not settings.wx_appid or not settings.wx_secret:
        raise RuntimeError("WX_APPID/WX_SECRET are not configured")

    if _token_cache["token"] and time.time() < _token_cache["expires_at"]:
        return str(_token_cache["token"])

    url = "https://api.weixin.qq.com/cgi-bin/token"
    params = {
        "grant_type": "client_credential",
        "appid": settings.wx_appid,
        "secret": settings.wx_secret,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.get(url, params=params)
        data = response.json()

    token = data.get("access_token")
    if not token:
        raise RuntimeError(f"failed to get WeChat access token: {data}")

    expires_in = int(data.get("expires_in", 7200))
    _token_cache["token"] = token
    _token_cache["expires_at"] = time.time() + max(60, expires_in - 300)
    return token


async def send_subscribe_message(
    openid: str,
    template_id: str,
    data: dict,
    page: str = "pages/match/match",
) -> dict:
    """Send a WeChat subscription message."""
    if not openid:
        raise RuntimeError("openid is required")
    if not template_id:
        raise RuntimeError("WX_TEMPLATE_ID_MATCH is not configured")

    token = await get_access_token()
    url = f"https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token={token}"
    body = {
        "touser": openid,
        "template_id": template_id,
        "page": page,
        "data": data,
        "miniprogram_state": "developer" if settings.app_env == "development" else "formal",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        response = await client.post(url, json=body)
        result = response.json()

    if result.get("errcode") != 0:
        raise RuntimeError(f"WeChat subscribe message failed: {result}")
    return result


async def push_match_result(
    openid: str,
    match_id: str,
    score: int,
    nickname: str,
    page: str | None = None,
) -> dict:
    """Push a match-result notification through WeChat subscription messages."""
    template_id = settings.wx_template_id_match
    if page is None:
        page = f"pages/match/match?from=push&match_id={match_id}"

    data = {
        "thing1": {"value": f"Your activity partner: {nickname}"[:20]},
        "thing2": {"value": f"Compatibility {score}%"},
        "time3": {"value": "This Wednesday"},
    }
    return await send_subscribe_message(openid, template_id, data, page)


def record_subscription(user_id: str, openid: str | None = None, template_id: str | None = None) -> bool:
    """Record a local subscription entry."""
    _subscriptions[user_id] = {
        "user_id": user_id,
        "openid": openid or "",
        "template_id": template_id or settings.wx_template_id_match or "",
        "subscribed": True,
        "subscribed_at": time.time(),
    }
    _save_subscriptions()
    return True


def get_subscription(user_id: str) -> dict | None:
    return _subscriptions.get(user_id)


def get_all_subscribed() -> list[dict]:
    return [entry for entry in _subscriptions.values() if entry.get("subscribed")]


def _load_subscriptions() -> None:
    global _subscriptions
    if not os.path.exists(_SUBSCRIPTIONS_FILE):
        _subscriptions = {}
        return

    try:
        with open(_SUBSCRIPTIONS_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)
        _subscriptions = data if isinstance(data, dict) else {}
    except Exception as exc:
        logger.warning("failed to load push subscriptions: %s", exc)
        _subscriptions = {}


def _save_subscriptions() -> None:
    try:
        os.makedirs(_DATA_DIR, exist_ok=True)
        with open(_SUBSCRIPTIONS_FILE, "w", encoding="utf-8") as file:
            json.dump(_subscriptions, file, ensure_ascii=False, indent=2)
    except Exception as exc:
        logger.warning("failed to save push subscriptions: %s", exc)


_load_subscriptions()
