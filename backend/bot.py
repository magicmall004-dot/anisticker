"""
AniSticker Telegram Bot
- Notifies owner of new orders
- Notifies users of order status changes
- /start command launches the Mini App
"""
import asyncio
import logging
from aiogram import Bot, Dispatcher, types, F
from aiogram.filters import CommandStart
from aiogram.types import (
    InlineKeyboardMarkup, InlineKeyboardButton,
    WebAppInfo, ReplyKeyboardMarkup, KeyboardButton,
)
from aiogram.utils.keyboard import InlineKeyboardBuilder

from config import get_settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

s = get_settings()
bot = Bot(token=s.BOT_TOKEN)
dp  = Dispatcher()

MINI_APP_URL = s.FRONTEND_URL   # e.g. https://HtunHlaAung.github.io/anisticker


# ── /start ───────────────────────────────────────────────────
@dp.message(CommandStart())
async def cmd_start(message: types.Message):
    kb = ReplyKeyboardMarkup(
        keyboard=[[
            KeyboardButton(
                text="🎨 Open AniSticker",
                web_app=WebAppInfo(url=MINI_APP_URL),
            )
        ]],
        resize_keyboard=True,
    )
    await message.answer(
        "✨ <b>Welcome to AniSticker!</b>\n\n"
        "Create custom animated emoji packs for your brand.\n"
        "Tap the button below to get started 👇",
        parse_mode="HTML",
        reply_markup=kb,
    )


# ── Notification helpers (called from FastAPI routes) ────────
async def send_order_notification(order: dict, db):
    """
    Send new-order alert to owner with full order details.
    """
    from database import get_db
    db = get_db()

    # Fetch user info
    user_res = db.table("users").select("first_name,last_name,username").eq("id", order["user_id"]).execute()
    u = user_res.data[0] if user_res.data else {}
    name = f"{u.get('first_name','')} {u.get('last_name','')}".strip() or "Unknown"
    uname = f"@{u['username']}" if u.get("username") else "no username"

    # Fetch order items with design names
    items_res = db.table("order_items").select("custom_text, designs(name)").eq("order_id", order["id"]).execute()
    item_lines = "\n".join(
f"  • {i['designs']['name']}" + (f" \u2014 \"{i['custom_text']}\"" if i.get("custom_text") else "")
        for i in items_res.data
    ) or "  (none)"

    text = (
        f"🆕 <b>New Order!</b>\n\n"
        f"👤 <b>Customer:</b> {name} ({uname})\n"
        f"🆔 <b>Order ID:</b> <code>{order['id'][:8]}…</code>\n"
        f"💰 <b>Total:</b> {order['total_price']:,.0f} MMK\n\n"
        f"📦 <b>Designs:</b>\n{item_lines}\n\n"
        f"🎨 <b>Brand:</b> {order.get('logo_name') or '—'} ({order.get('logo_symbol') or '—'})\n"
        f"🎨 <b>Colors:</b> {order.get('primary_color','—')} / {order.get('secondary_color','—')}\n"
    )
    if order.get("tg_username"):
        text += f"📱 <b>Username:</b> {order['tg_username']}\n"

    # Action buttons in owner dashboard
    builder = InlineKeyboardBuilder()
    builder.button(text="✅ Accept",  callback_data=f"order:accept:{order['id']}")
    builder.button(text="❌ Cancel",  callback_data=f"order:cancel:{order['id']}")
    builder.button(text="👁 View TX", url=order.get("transaction_image_url", ""))
    builder.adjust(2, 1)

    await bot.send_message(
        s.OWNER_TELEGRAM_ID,
        text,
        parse_mode="HTML",
        reply_markup=builder.as_markup(),
    )


async def send_status_update(user_id: int, order_id: str, status: str):
    """Notify customer of their order status change."""
    status_msgs = {
        "accepted":  "✅ Your order has been <b>accepted</b>! We're working on your animated emoji pack.",
        "cancelled": "❌ Your order has been <b>cancelled</b>. Contact us if you have questions.",
        "done":      "🎉 Your animated emoji pack is <b>ready</b>! Check it below 👇",
    }
    msg = status_msgs.get(status)
    if not msg:
        return

    text = f"{msg}\n\n🆔 Order: <code>{order_id[:8]}…</code>"

    builder = InlineKeyboardBuilder()
    builder.button(
        text="📦 View My Orders",
        web_app=WebAppInfo(url=f"{MINI_APP_URL}?page=orders"),
    )

    await bot.send_message(user_id, text, parse_mode="HTML", reply_markup=builder.as_markup())


# ── Callback query handler for owner quick actions ───────────
@dp.callback_query(F.data.startswith("order:"))
async def handle_order_callback(callback: types.CallbackQuery):
    if callback.from_user.id != s.OWNER_TELEGRAM_ID:
        await callback.answer("Not authorized", show_alert=True)
        return

    _, action, order_id = callback.data.split(":", 2)
    status_map = {"accept": "accepted", "cancel": "cancelled"}
    new_status = status_map.get(action)

    if not new_status:
        await callback.answer("Unknown action")
        return

    from database import get_db
    db = get_db()
    res = db.table("orders").update({"status": new_status}).eq("id", order_id).execute()
    if res.data:
        order = res.data[0]
        await send_status_update(order["user_id"], order_id, new_status)
        await callback.answer(f"Order {new_status}!", show_alert=True)
        # Edit the message to reflect the action
        await callback.message.edit_text(
            callback.message.text + f"\n\n{'✅' if new_status == 'accepted' else '❌'} <b>{new_status.upper()}</b> by owner",
            parse_mode="HTML",
        )
    else:
        await callback.answer("Order not found", show_alert=True)


# ── Main ──────────────────────────────────────────────────────
async def main():
    logger.info("Starting AniSticker bot…")
    await dp.start_polling(bot)


if __name__ == "__main__":
    asyncio.run(main())
