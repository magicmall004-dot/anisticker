from __future__ import annotations
from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────
class InitDataRequest(BaseModel):
    init_data: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


# ── Categories ───────────────────────────────────────────────
class CategoryCreate(BaseModel):
    name: str
    sort_order: int = 0


class CategoryOut(BaseModel):
    id: str
    name: str
    sort_order: int
    created_at: datetime


# ── Designs ──────────────────────────────────────────────────
class DesignCreate(BaseModel):
    category_id: Optional[str] = None
    type: str                          # regular | adaptive
    file_url: Optional[str] = None
    file_type: Optional[str] = None    # json | tgs
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    has_text: bool = False
    user_price: float = 0
    reseller_price: float = 0
    is_visible: bool = True


class DesignUpdate(BaseModel):
    category_id: Optional[str] = None
    type: Optional[str] = None
    file_url: Optional[str] = None
    file_type: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    has_text: Optional[bool] = None
    user_price: Optional[float] = None
    reseller_price: Optional[float] = None
    is_visible: Optional[bool] = None


class DesignOut(BaseModel):
    id: str
    category_id: Optional[str]
    category_name: Optional[str] = None
    type: str
    file_url: Optional[str]
    file_type: Optional[str]
    primary_color: Optional[str]
    secondary_color: Optional[str]
    has_text: bool
    user_price: float
    reseller_price: float
    is_visible: bool
    created_at: datetime


# ── Payment Methods ──────────────────────────────────────────
class PaymentMethodCreate(BaseModel):
    name: str
    logo_url: Optional[str] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    is_visible: bool = True
    sort_order: int = 0


class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None
    logo_url: Optional[str] = None
    account_name: Optional[str] = None
    account_number: Optional[str] = None
    is_visible: Optional[bool] = None
    sort_order: Optional[int] = None


class PaymentMethodOut(BaseModel):
    id: str
    name: str
    logo_url: Optional[str]
    account_name: Optional[str]
    account_number: Optional[str]
    is_visible: bool
    sort_order: int


# ── Orders ───────────────────────────────────────────────────
class OrderItemIn(BaseModel):
    design_id: str
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None
    extra_colors: List[dict] = []
    custom_text: Optional[str] = None


class OrderCreate(BaseModel):
    items: List[OrderItemIn]
    payment_method_id: str
    transaction_image_url: str
    total_price: float

    logo_type: str                       # existing | new
    logo_id: Optional[str] = None
    logo_name: Optional[str] = None
    logo_symbol: Optional[str] = None
    logo_file_url: Optional[str] = None

    add_username: bool = False
    tg_username: Optional[str] = None
    primary_color: Optional[str] = None
    secondary_color: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str   # pending | accepted | cancelled | done


class OrderOut(BaseModel):
    id: str
    user_id: int
    status: str
    payment_method_id: Optional[str]
    transaction_image_url: Optional[str]
    total_price: float
    logo_type: Optional[str]
    logo_name: Optional[str]
    logo_symbol: Optional[str]
    logo_file_url: Optional[str]
    add_username: bool
    tg_username: Optional[str]
    primary_color: Optional[str]
    secondary_color: Optional[str]
    created_at: datetime
    updated_at: datetime
    user: Optional[dict] = None
    items: Optional[List[dict]] = None


# ── Users ────────────────────────────────────────────────────
class UserRoleUpdate(BaseModel):
    role: str   # owner | reseller | user


class UserBanUpdate(BaseModel):
    is_banned: bool


# ── Upload ───────────────────────────────────────────────────
class UploadResponse(BaseModel):
    url: str
    path: str
