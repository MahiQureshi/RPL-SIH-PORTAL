import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent

class Settings:
    PROJECT_NAME: str = "AI-Assisted Skill Assessment Tool for RPL"
    VERSION: str = "1.0.0 (SIH National Edition)"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "rpl_sih_hackathon_super_secret_jwt_key_2026_gov_tech")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for hackathon convenience
    
    # Authoritative DB: SQLite default, configurable to PostgreSQL via DATABASE_URL
    DATABASE_URL: str = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR / 'rpl_sih.db'}")
    
    # Evidence file storage directory
    STORAGE_DIR: Path = BASE_DIR / "storage"
    EVIDENCE_DIR: Path = STORAGE_DIR / "evidence"

settings = Settings()

# Ensure storage directories exist
settings.EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)
