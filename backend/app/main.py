from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
from pathlib import Path
from app.core.config import settings
from app.db.session import engine, Base
from app.db.seed import seed_database
from app.api import (
    auth, qualifications, matching, declarations,
    assignments, assessments, evidence, reviews, analytics, audit
)

# Ensure tables exist
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Automatically seed the database if not already seeded
    try:
        seed_database()
    except Exception as e:
        print(f"[STARTUP WARNING] Seed check failed: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart India Hackathon — AI-Assisted Skill Assessment Tool for Recognition of Prior Learning (RPL)",
    lifespan=lifespan
)

# Enable CORS for Vite frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static evidence storage for secure preview
app.mount("/storage", StaticFiles(directory=str(settings.STORAGE_DIR)), name="storage")

# Include API Routers
app.include_router(auth.router)
app.include_router(qualifications.router)
app.include_router(matching.router)
app.include_router(declarations.router)
app.include_router(assignments.router)
app.include_router(assessments.router)
app.include_router(evidence.router)
app.include_router(reviews.router)
app.include_router(analytics.router)
app.include_router(audit.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "mode": "offline-ready",
        "database": "authoritative-sqlite" if "sqlite" in settings.DATABASE_URL else "postgresql"
    }

# Check for production frontend bundle
candidate_dist_dirs = [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path(__file__).resolve().parent.parent / "frontend" / "dist",
    Path(__file__).resolve().parent.parent / "dist",
    Path("/app/frontend/dist"),
]
frontend_dist = next((p for p in candidate_dist_dirs if p.exists() and (p / "index.html").exists()), None)

if frontend_dist:
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        target = frontend_dist / full_path
        if full_path and target.is_file():
            return FileResponse(target)
        return FileResponse(frontend_dist / "index.html")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
