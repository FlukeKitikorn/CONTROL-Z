from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.redis import close_redis, init_redis
from app.services.image_storage import legacy_upload_root, upload_root

_legacy_uploads = legacy_upload_root()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_redis()
    yield
    close_redis()


def create_app() -> FastAPI:
    app = FastAPI(title="CONTROL-Z API", version="0.1.0", lifespan=lifespan)
    root = upload_root()
    root.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(root)), name="uploads")
    if _legacy_uploads.exists():
        app.mount("/static", StaticFiles(directory=str(_legacy_uploads)), name="static")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(api_router, prefix="/api/v1")

    @app.get("/")
    def root() -> dict[str, str]:
        return {"service": "control-z-api", "docs": "/docs"}

    return app


app = create_app()
