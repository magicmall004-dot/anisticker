from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..auth import get_current_user, require_owner
from ..models import DesignCreate, DesignUpdate, DesignOut

router = APIRouter(prefix="/designs", tags=["designs"])


def _enrich(designs: list, db) -> list:
    """Attach category name to each design row."""
    if not designs:
        return designs
    cat_ids = list({d["category_id"] for d in designs if d.get("category_id")})
    cats = {}
    if cat_ids:
        res = db.table("categories").select("id,name").in_("id", cat_ids).execute()
        cats = {c["id"]: c["name"] for c in res.data}
    for d in designs:
        d["category_name"] = cats.get(d.get("category_id"))
    return designs


@router.get("/", response_model=list[DesignOut])
async def list_designs(
    category_id: str | None = None,
    show_hidden: bool = False,
    user=Depends(get_current_user),
):
    db = get_db()
    q = db.table("designs").select("*").order("created_at", desc=True)

    # Non-owners only see visible designs
    if user["role"] != "owner" or not show_hidden:
        q = q.eq("is_visible", True)

    if category_id:
        q = q.eq("category_id", category_id)

    res = q.execute()
    return _enrich(res.data, db)


@router.get("/{design_id}", response_model=DesignOut)
async def get_design(design_id: str, user=Depends(get_current_user)):
    db = get_db()
    res = db.table("designs").select("*").eq("id", design_id).single().execute()
    if not res.data:
        raise HTTPException(404, "Design not found")
    return _enrich([res.data], db)[0]


@router.post("/", response_model=DesignOut)
async def create_design(body: DesignCreate, _user=Depends(require_owner)):
    db = get_db()
    res = db.table("designs").insert(body.model_dump()).execute()
    return _enrich(res.data, db)[0]


@router.put("/{design_id}", response_model=DesignOut)
async def update_design(design_id: str, body: DesignUpdate, _user=Depends(require_owner)):
    db = get_db()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    res = db.table("designs").update(data).eq("id", design_id).execute()
    if not res.data:
        raise HTTPException(404, "Design not found")
    return _enrich(res.data, db)[0]


@router.delete("/{design_id}")
async def delete_design(design_id: str, _user=Depends(require_owner)):
    db = get_db()
    db.table("designs").delete().eq("id", design_id).execute()
    return {"ok": True}
