from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from auth import get_current_user, require_owner
from models import UserRoleUpdate, UserBanUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/")
async def list_users(_owner=Depends(require_owner)):
    db = get_db()
    res = db.table("users").select("*").order("created_at", desc=True).execute()
    return res.data


@router.get("/me")
async def get_me(user=Depends(get_current_user)):
    return user


@router.get("/{user_id}")
async def get_user(user_id: int, _owner=Depends(require_owner)):
    db = get_db()
    res = db.table("users").select("*").eq("id", user_id).single().execute()
    if not res.data:
        raise HTTPException(404, "User not found")
    return res.data


@router.patch("/{user_id}/role")
async def set_role(user_id: int, body: UserRoleUpdate, owner=Depends(require_owner)):
    if body.role not in ("owner", "reseller", "user"):
        raise HTTPException(400, "Invalid role")
    if user_id == owner["id"] and body.role != "owner":
        raise HTTPException(400, "Cannot demote yourself")
    db = get_db()
    res = db.table("users").update({"role": body.role}).eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(404, "User not found")
    return res.data[0]


@router.patch("/{user_id}/ban")
async def set_ban(user_id: int, body: UserBanUpdate, owner=Depends(require_owner)):
    if user_id == owner["id"]:
        raise HTTPException(400, "Cannot ban yourself")
    db = get_db()
    res = db.table("users").update({"is_banned": body.is_banned}).eq("id", user_id).execute()
    if not res.data:
        raise HTTPException(404, "User not found")
    return res.data[0]
