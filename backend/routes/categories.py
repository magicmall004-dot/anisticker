from fastapi import APIRouter, Depends, HTTPException
from database import get_db
from auth import get_current_user, require_owner
from models import CategoryCreate, CategoryOut

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("/", response_model=list[CategoryOut])
async def list_categories(_user=Depends(get_current_user)):
    db = get_db()
    res = db.table("categories").select("*").order("sort_order").execute()
    return res.data


@router.post("/", response_model=CategoryOut)
async def create_category(body: CategoryCreate, _user=Depends(require_owner)):
    db = get_db()
    res = db.table("categories").insert(body.model_dump()).execute()
    return res.data[0]


@router.put("/{cat_id}", response_model=CategoryOut)
async def update_category(cat_id: str, body: CategoryCreate, _user=Depends(require_owner)):
    db = get_db()
    res = db.table("categories").update(body.model_dump()).eq("id", cat_id).execute()
    if not res.data:
        raise HTTPException(404, "Category not found")
    return res.data[0]


@router.delete("/{cat_id}")
async def delete_category(cat_id: str, _user=Depends(require_owner)):
    db = get_db()
    db.table("categories").delete().eq("id", cat_id).execute()
    return {"ok": True}
