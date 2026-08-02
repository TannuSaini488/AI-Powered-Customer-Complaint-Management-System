from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.complaints import router as complaints_router
from config.settings import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI-Powered Customer Complaint Management System",
        version="0.1.0",
        description="AI-first pharmaceutical QMS complaint intake API.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[settings.frontend_url],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health_check() -> dict[str, str]:
        return {"status": "ok", "environment": settings.app_env}

    app.include_router(complaints_router, prefix="/api/complaints", tags=["complaints"])
    return app


app = create_app()
