from fastapi import APIRouter, Depends, HTTPException
from auth import validate_init_data, create_token, get_current_user
from config import get_settings
from database import get_db
from models import InitDataRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/telegram", response_model=TokenResponse)
async def telegram_login(body: InitDataRequest):
    s = get_settings()
    tg_user = validate_init_data(body.init_data, s.BOT_TOKEN)

    if not tg_user:
        raise HTTPException(status_code=401, detail="Invalid Telegram initData")

    user_id = int(tg_user["id"])
    db = get_db()

    # Upsert user
    upsert_data = {
        "id": user_id,
        "username": tg_user.get("username"),
        "first_name": tg_user.get("first_name", ""),
        "last_name": tg_user.get("last_name"),
        "photo_url": tg_user.get("photo_url"),
    }

    # Check if user already exists (to preserve role)
    existing = db.table("users").select("role, is_banned").eq("id", user_id).execute()

    if existing.data:
        # Update profile info only
        db.table("users").update({
            "username": upsert_data["username"],
            "first_name": upsert_data["first_name"],
            "last_name": upsert_data["last_name"],
            "photo_url": upsert_data.get("photo_url"),
        }).eq("id", user_id).execute()
        role = existing.data[0]["role"]
        is_banned = existing.data[0]["is_banned"]
    else:
        # First time – assign owner if matches OWNER_TELEGRAM_ID
        role = "owner" if user_id == s.OWNER_TELEGRAM_ID else "user"
        upsert_data["role"] = role
        upsert_data["is_banned"] = False
        db.table("users").insert(upsert_data).execute()
        is_banned = False

    if is_banned:
        raise HTTPException(status_code=403, detail="You are banned from this service")

    token = create_token(user_id, role)

    user_row = db.table("users").select("*").eq("id", user_id).single().execute().data

    return TokenResponse(access_token=token, user=user_row)


@router.get("/me")
async def get_me(user: dict = Depends(get_current_user)):
    return user
