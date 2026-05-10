import logging
import random
import string

from sqlalchemy import select, func

from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

GENESIS_THRESHOLD = 1000
INVITE_CODE_LENGTH = 8
DEV_VERIFICATION_CODE = "123456"


def generate_invite_code() -> str:
    chars = string.ascii_uppercase + string.digits
    # 排除易混淆字符: 0/O, 1/I/L
    chars = "".join(c for c in chars if c not in "0O1IL")
    return "".join(random.choices(chars, k=INVITE_CODE_LENGTH))


async def generate_unique_invite_code(db) -> str:
    for _ in range(20):
        code = generate_invite_code()
        exists = await db.execute(select(User).where(User.invite_code == code))
        if not exists.scalar_one_or_none():
            return code
    raise RuntimeError("Failed to generate unique invite code")


async def get_user_count(db) -> int:
    result = await db.execute(select(func.count()).select_from(User))
    return result.scalar_one()


async def validate_invite_code(db, code: str) -> tuple[bool, str]:
    if not code:
        return False, "请输入邀请码"

    total = await get_user_count(db)

    if total < GENESIS_THRESHOLD:
        if code == settings.genesis_invite_code:
            return True, "创始邀请码验证通过"
        return False, f"当前为创始期（{total}/{GENESIS_THRESHOLD}），请使用创始邀请码"

    # ≥ 1000: 必须是已有用户的 invite_code
    result = await db.execute(select(User).where(User.invite_code == code))
    inviter = result.scalar_one_or_none()
    if inviter:
        return True, "邀请码验证通过"

    return False, "邀请码无效"


async def create_or_get_user(db, phone: str, openid: str) -> User:
    result = await db.execute(select(User).where(User.phone == phone))
    existing = result.scalar_one_or_none()

    if existing:
        if openid and existing.openid != openid:
            existing.openid = openid
        return existing

    invite_code = await generate_unique_invite_code(db)

    user = User(
        openid=openid or f"phone_{phone}",
        phone=phone,
        invite_code=invite_code,
    )
    db.add(user)
    await db.flush()
    return user


# ---- SMS Verification (Redis-based) ----

async def store_code(redis, phone: str, code: str):
    cooldown_key = f"sms_cooldown:{phone}"
    code_key = f"sms_code:{phone}"

    ttl = await redis.ttl(cooldown_key)
    if ttl and ttl > 0:
        raise ValueError(f"请 {ttl} 秒后再试")

    pipe = redis.pipeline()
    pipe.setex(cooldown_key, 60, "1")
    pipe.setex(code_key, 300, code)
    await pipe.execute()

    logger.info("Verification code for %s: %s", phone, code)


async def verify_code(redis, phone: str, code: str) -> bool:
    if settings.app_env == "development" and code == DEV_VERIFICATION_CODE:
        return True

    code_key = f"sms_code:{phone}"
    try:
        stored = await redis.get(code_key)
    except Exception as e:
        if settings.app_env == "development":
            logger.warning("Redis unavailable while verifying code: %s", e)
            return False
        raise

    stored_code = stored.decode() if isinstance(stored, bytes) else stored
    if stored_code and stored_code == code:
        await redis.delete(code_key)
        return True
    return False


def generate_code() -> str:
    return f"{random.randint(0, 999999):06d}"
