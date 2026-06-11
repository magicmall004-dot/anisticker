import asyncio
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from database import get_db
from auth import get_current_user, require_owner
from models import OrderCreate, OrderStatusUpdate, OrderOut

router = APIRouter(prefix="/orders", tags=["orders"])


def _get_bot():
    """Lazy import to avoid circular deps at startup."""
    try:
        from ..bot import send_order_notification, send_status_update
        return send_order_notification, send_status_update
    except Exception:
        return None, None


async def _notify_owner(order: dict, db):
    """Send Telegram message to owner about new order."""
    send_order_notification, _ = _get_bot()
    if send_order_notification:
        try:
            await send_order_notification(order, db)
        except Exception as e:
            print(f"Bot notification failed: {e}")


async def _notify_user(user_id: int, order_id: str, status: str):
    _, send_status_update = _get_bot()
    if send_status_update:
        try:
            await send_status_update(user_id, order_id, status)
        except Exception as e:
            print(f"Bot status update failed: {e}")


@router.post("/", response_model=OrderOut)
async def create_order(
    body: OrderCreate,
    background_tasks: BackgroundTasks,
    user=Depends(get_current_user),
):
    db = get_db()

    # Create order
    order_data = {
        "user_id": user["id"],
        "status": "pending",
        "payment_method_id": body.payment_method_id,
        "transaction_image_url": body.transaction_image_url,
        "total_price": body.total_price,
        "logo_type": body.logo_type,
        "logo_id": body.logo_id,
        "logo_name": body.logo_name,
        "logo_symbol": body.logo_symbol,
        "logo_file_url": body.logo_file_url,
        "add_username": body.add_username,
        "tg_username": body.tg_username,
        "primary_color": body.primary_color,
        "secondary_color": body.secondary_color,
    }
    order_res = db.table("orders").insert(order_data).execute()
    order = order_res.data[0]
    order_id = order["id"]

    # Create order items
    items = []
    for item in body.items:
        item_data = {
            "order_id": order_id,
            "design_id": item.design_id,
            "primary_color": item.primary_color,
            "secondary_color": item.secondary_color,
            "extra_colors": item.extra_colors,
            "custom_text": item.custom_text,
        }
        items.append(item_data)

    if items:
        db.table("order_items").insert(items).execute()

    # Notify owner in background
    background_tasks.add_task(_notify_owner, order, db)

    return _enrich_order(order, db, include_items=True)


@router.get("/", response_model=list[OrderOut])
async def list_orders(
    status: str | None = None,
    user=Depends(get_current_user),
):
    db = get_db()
    q = db.table("orders").select("*").order("created_at", desc=True)

    if user["role"] != "owner":
        q = q.eq("user_id", user["id"])
    elif status:
        q = q.eq("status", status)

    res = q.execute()
    return [_enrich_order(o, db) for o in res.data]


@router.get("/{order_id}", response_model=OrderOut)
async def get_order(order_id: str, user=Depends(get_current_user)):
    db = get_db()
    res = db.table("orders").select("*").eq("id", order_id).single().execute()
    if not res.data:
        raise HTTPException(404, "Order not found")
    order = res.data

    # Users can only view their own orders
    if user["role"] != "owner" and order["user_id"] != user["id"]:
        raise HTTPException(403, "Forbidden")

    return _enrich_order(order, db, include_items=True)


@router.patch("/{order_id}/status")
async def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    background_tasks: BackgroundTasks,
    _owner=Depends(require_owner),
):
    allowed = ("pending", "accepted", "cancelled", "done")
    if body.status not in allowed:
        raise HTTPException(400, f"Status must be one of {allowed}")

    db = get_db()
    res = db.table("orders").update({"status": body.status}).eq("id", order_id).execute()
    if not res.data:
        raise HTTPException(404, "Order not found")

    order = res.data[0]
    background_tasks.add_task(_notify_user, order["user_id"], order_id, body.status)

    return {"ok": True, "status": body.status}


# ── Helpers ───────────────────────────────────────────────────
def _enrich_order(order: dict, db, include_items: bool = False) -> dict:
    # Attach user info
    user_res = db.table("users").select("id,username,first_name,last_name,photo_url").eq("id", order["user_id"]).execute()
    order["user"] = user_res.data[0] if user_res.data else None

    if include_items:
        items_res = db.table("order_items").select("*, designs(name,file_url,file_type,primary_color,secondary_color)").eq("order_id", order["id"]).execute()
        order["items"] = items_res.data

    return order
