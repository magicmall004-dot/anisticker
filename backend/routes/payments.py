from fastapi import APIRouter, Depends, HTTPException
from ..database import get_db
from ..auth import get_current_user, require_owner
from ..models import PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodOut

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/", response_model=list[PaymentMethodOut])
async def list_payments(user=Depends(get_current_user)):
    db = get_db()
    q = db.table("payment_methods").select("*").order("sort_order")
    if user["role"] != "owner":
        q = q.eq("is_visible", True)
    res = q.execute()
    return res.data


@router.post("/", response_model=PaymentMethodOut)
async def create_payment(body: PaymentMethodCreate, _user=Depends(require_owner)):
    db = get_db()
    res = db.table("payment_methods").insert(body.model_dump()).execute()
    return res.data[0]


@router.put("/{pm_id}", response_model=PaymentMethodOut)
async def update_payment(pm_id: str, body: PaymentMethodUpdate, _user=Depends(require_owner)):
    db = get_db()
    data = {k: v for k, v in body.model_dump().items() if v is not None}
    res = db.table("payment_methods").update(data).eq("id", pm_id).execute()
    if not res.data:
        raise HTTPException(404, "Payment method not found")
    return res.data[0]


@router.delete("/{pm_id}")
async def delete_payment(pm_id: str, _user=Depends(require_owner)):
    db = get_db()
    db.table("payment_methods").delete().eq("id", pm_id).execute()
    return {"ok": True}
