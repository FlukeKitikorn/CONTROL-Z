from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.redis import close_redis, init_redis

_uploads = Path(__file__).resolve().parent.parent / "uploads"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_redis()
    yield
    close_redis()


def create_app() -> FastAPI:
    app = FastAPI(title="CONTROL-Z API", version="0.1.0", lifespan=lifespan)
    _uploads.mkdir(parents=True, exist_ok=True)
    app.mount("/static", StaticFiles(directory=str(_uploads)), name="static")
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
