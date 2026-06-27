from fastapi import APIRouter

from app.controllers import (
    admin_controller,
    announcements_controller,
    auth_controller,
    calculations_controller,
    forms_controller,
    ghg_controller,
    health_controller,
    me_controller,
    organizations_controller,
    reference_controller,
    reports_controller,
)

api_router = APIRouter()
api_router.include_router(health_controller.router, tags=["health"])
api_router.include_router(auth_controller.router)
api_router.include_router(me_controller.router)
api_router.include_router(organizations_controller.router)
api_router.include_router(forms_controller.router)
api_router.include_router(reference_controller.router)
api_router.include_router(ghg_controller.router)
api_router.include_router(calculations_controller.router)
api_router.include_router(reports_controller.router)
api_router.include_router(admin_controller.router)
api_router.include_router(announcements_controller.router)
