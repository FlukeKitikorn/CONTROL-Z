from fastapi import APIRouter

router = APIRouter()


@router.get("/health", summary="สถานะบริการ")
def health() -> dict[str, str]:
    return {"status": "ok"}
