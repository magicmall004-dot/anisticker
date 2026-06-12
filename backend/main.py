from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from urllib.parse import urlparse

from config import get_settings
from routes.auth       import router as auth_router
from routes.categories import router as cat_router
from routes.designs    import router as design_router
from routes.payments   import router as payment_router
from routes.orders     import router as order_router
from routes.users      import router as user_router
from routes.upload     import router as upload_router

s = get_settings()

# Extract just the origin (scheme + host) from FRONTEND_URL.
# e.g. "https://magicmall004-dot.github.io/anisticker" → "https://magicmall004-dot.github.io"
_parsed = urlparse(s.FRONTEND_URL)
_frontend_origin = f"{_parsed.scheme}://{_parsed.netloc}"

# Using a specific list (not "*") is required when allow_credentials=True.
ALLOWED_ORIGINS = [
    _frontend_origin,            # production GitHub Pages origin
    "http://localhost:5173",     # Vite dev server
    "http://127.0.0.1:5173",
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 AniSticker API starting  [debug={s.DEBUG}]")
    print(f"   Allowed origins: {ALLOWED_ORIGINS}")
    yield
    print("API shutting down")


app = FastAPI(
    title="AniSticker API",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if s.DEBUG else None,
    redoc_url=None,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(auth_router,    prefix="/api/v1")
app.include_router(cat_router,     prefix="/api/v1")
app.include_router(design_router,  prefix="/api/v1")
app.include_router(payment_router, prefix="/api/v1")
app.include_router(order_router,   prefix="/api/v1")
app.include_router(user_router,    prefix="/api/v1")
app.include_router(upload_router,  prefix="/api/v1")


@app.get("/")
async def health():
    return {"status": "ok", "service": "AniSticker API"}
