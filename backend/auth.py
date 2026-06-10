import hashlib
import hmac
import json
import time
from urllib.parse import unquote, parse_qsl
from typing import Optional

import jwt
from fastapi import Depends, HTTPException, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import get_settings
from .database import get_db

bearer = HTTPBearer(auto_error=False)


# ── Validate Telegram WebApp initData ───────────────────────
def validate_init_data(init_data: str, bot_token: str) -> Optional[dict]:
    """
    Returns the parsed user dict if valid, else None.
    Spec: https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
    """
    try:
        vals = dict(parse_qsl(unquote(init_data), keep_blank_values=True))
        check_hash = vals.pop("hash", None)
        if not check_hash:
            return None

        # check_string = sorted key=value pairs joined by \n
        check_string = "\n".join(f"{k}={v}" for k, v in sorted(vals.items()))

        secret_key = hmac.new(b"WebAppData", bot_token.encode(), hashlib.sha256).digest()
        expected = hmac.new(secret_key, check_string.encode(), hashlib.sha256).hexdigest()

        if not hmac.compare_digest(expected, check_hash):
            return None

        # Optional: reject stale data (> 1 day)
        auth_date = int(vals.get("auth_date", 0))
        if time.time() - auth_date > 86_400:
            return None

        user_json = vals.get("user", "{}")
        return json.loads(user_json)
    except Exception:
        return None


# ── Issue / Verify JWT ────────────────────────────────────────
def create_token(user_id: int, role: str) -> str:
    s = get_settings()
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": int(time.time()) + s.JWT_EXPIRE_HOURS * 3600,
    }
    return jwt.encode(payload, s.JWT_SECRET, algorithm=s.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    s = get_settings()
    return jwt.decode(token, s.JWT_SECRET, algorithms=[s.JWT_ALGORITHM])


# ── FastAPI dependency ────────────────────────────────────────
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer),
):
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = decode_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user_id = int(payload["sub"])
    db = get_db()
    result = db.table("users").select("*").eq("id", user_id).single().execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    user = result.data
    if user["is_banned"]:
        raise HTTPException(status_code=403, detail="User is banned")
    return user


async def require_owner(user: dict = Depends(get_current_user)):
    if user["role"] != "owner":
        raise HTTPException(status_code=403, detail="Owner only")
    return user


async def require_reseller_or_owner(user: dict = Depends(get_current_user)):
    if user["role"] not in ("owner", "reseller"):
        raise HTTPException(status_code=403, detail="Reseller or owner only")
    return user
