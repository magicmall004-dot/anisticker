import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from database import get_db
from auth import get_current_user, require_owner
from config import get_settings

router = APIRouter(prefix="/upload", tags=["upload"])
MAX_SIZE_MB = 10


def _upload(bucket: str, data: bytes, filename: str, content_type: str) -> str:
    db = get_db()
    s = get_settings()
    path = f"{uuid.uuid4()}/{filename}"
    db.storage.from_(bucket).upload(
        path, data,
        file_options={"content-type": content_type, "upsert": "true"},
    )
    return f"{s.SUPABASE_URL}/storage/v1/object/public/{bucket}/{path}"


@router.post("/design")
async def upload_design_file(file: UploadFile = File(...), _owner=Depends(require_owner)):
    data = await file.read()
    if len(data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, f"Max {MAX_SIZE_MB}MB")
    ct = file.content_type or "application/octet-stream"
    url = _upload("designs", data, file.filename or "design", ct)
    ext = (file.filename or "").rsplit(".", 1)[-1].lower()
    return {"url": url, "file_type": "tgs" if ext == "tgs" else "json"}


@router.post("/payment-logo")
async def upload_payment_logo(file: UploadFile = File(...), _owner=Depends(require_owner)):
    data = await file.read()
    url = _upload("payments", data, file.filename or "logo.png", file.content_type or "image/png")
    return {"url": url}


@router.post("/logo")
async def upload_logo_file(file: UploadFile = File(...), _user=Depends(get_current_user)):
    data = await file.read()
    ct = file.content_type or "application/octet-stream"
    ext = (file.filename or "logo.png").rsplit(".", 1)[-1].lower()
    url = _upload("logos", data, file.filename or f"logo.{ext}", ct)
    return {"url": url, "file_type": ext}


@router.post("/transaction")
async def upload_transaction(file: UploadFile = File(...), _user=Depends(get_current_user)):
    data = await file.read()
    if len(data) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(400, "File too large")
    url = _upload("transactions", data, file.filename or "tx.jpg", file.content_type or "image/jpeg")
    return {"url": url}
