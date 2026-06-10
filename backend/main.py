from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from routes.auth       import router as auth_router
from routes.categories import router as cat_router
from routes.designs    import router as design_router
from routes.payments   import router as payment_router
from routes.orders     import router as order_router
from routes.users      import router as user_router
from routes.upload     import router as upload_router

s = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"🚀 AniSticker API starting  [debug={s.DEBUG}]")
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
    allow_origins=s.ALLOWED_ORIGINS,
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
