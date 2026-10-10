"""
AirTrack REST API Application Entrypoint
Compliant with OpenAPI 3.0, RFC 7807 Problem Details, and Spring Boot Actuator health format.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.errors import ProblemException, create_problem_response
from app.db.init_db import init_database
from app.api.v1.endpoints import air_quality, locations, auth, user_data, admin

from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_database()
    yield

app = FastAPI(
    title="AirTrack API",
    description="Explainable, audience-specific air quality verdict & decision engine for India.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers for RFC 7807
@app.exception_handler(ProblemException)
async def problem_exception_handler(request: Request, exc: ProblemException):
    return create_problem_response(
        request=request,
        status_code=exc.status_code,
        title=exc.title,
        detail=exc.detail,
        code=exc.code,
        errors=exc.errors
    )

# Spring Boot Actuator compatible health endpoint
@app.get("/actuator/health", tags=["Health"])
def health_check():
    return {
        "status": "UP",
        "components": {
            "db": {"status": "UP", "details": {"database": "SQLite/PostgreSQL"}},
            "demoMode": {"status": "UP", "enabled": settings.AIRTRACK_DEMO_MODE},
            "cpcbEngine": {"status": "UP", "scale": "CPCB_NAQI"}
        }
    }

# Mount /api/v1 routers
app.include_router(air_quality.router, prefix=settings.API_V1_STR)
app.include_router(locations.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(user_data.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)

@app.get("/", tags=["Root"])
def root():
    return {
        "project": "AirTrack",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/actuator/health",
        "demoMode": settings.AIRTRACK_DEMO_MODE
    }
