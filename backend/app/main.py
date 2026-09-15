from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1.endpoints import health, calculator, foods

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix=settings.API_V1_STR, tags=["Health"])
app.include_router(health.router, tags=["Root Health"]) # Also available directly at /health
app.include_router(calculator.router, prefix=f"{settings.API_V1_STR}/calculator", tags=["Calculator"])
app.include_router(foods.router, prefix=f"{settings.API_V1_STR}/foods", tags=["Foods"])

@app.get("/")
def root():
    return {
        "message": "Welcome to Calzy API - Precision Nutrition & Calorie Tracking",
        "docs": "/docs",
        "health": "/health",
        "version": settings.VERSION,
    }
