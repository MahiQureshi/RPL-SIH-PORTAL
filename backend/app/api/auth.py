from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel, EmailStr
from typing import Optional
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User, WorkerProfile, AssessorProfile, AuditEvent
from app.core.security import verify_password, get_password_hash, create_access_token, decode_access_token

router = APIRouter(prefix="/api/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login", auto_error=False)

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    preferred_language: Optional[str] = "en"
    trade_preference: Optional[str] = None
    years_experience: Optional[float] = 0.0

class DemoLoginRequest(BaseModel):
    role: str  # 'WORKER' | 'ASSESSOR' | 'ADMIN'

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing or invalid."
        )
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token."
        )
    user_id = payload["sub"]
    user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or account is deactivated."
        )
    return user

def require_role(allowed_roles: list[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Requires one of the following roles: {', '.join(allowed_roles)}"
            )
        return current_user
    return role_checker

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/demo-login")
def demo_login(req: DemoLoginRequest, db: Session = Depends(get_db)):
    role_email_map = {
        "WORKER": "worker@rpl.gov.in",
        "ASSESSOR": "assessor@rpl.gov.in",
        "ADMIN": "admin@rpl.gov.in"
    }
    target_email = role_email_map.get(req.role.upper())
    if not target_email:
        raise HTTPException(status_code=400, detail="Invalid demo role requested.")
    
    user = db.query(User).filter(User.email == target_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Demo account not found in database.")
    
    token = create_access_token({"sub": user.id, "email": user.email, "role": user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
            "role": user.role
        }
    }

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == req.email.lower().strip()).first()
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    
    new_user = User(
        email=req.email.lower().strip(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name,
        role="WORKER",
        is_active=True
    )
    db.add(new_user)
    db.flush()

    worker_profile = WorkerProfile(
        user_id=new_user.id,
        phone=req.phone,
        preferred_language=req.preferred_language or "en",
        years_experience=req.years_experience or 0.0,
        trade_preference=req.trade_preference
    )
    db.add(worker_profile)
    
    audit = AuditEvent(
        actor_id=new_user.id,
        actor_name=new_user.full_name,
        actor_role="WORKER",
        event_type="WORKER_REGISTERED",
        record_type="USER",
        record_id=new_user.id,
        details=f"New candidate registered: {new_user.full_name} ({new_user.email})"
    )
    db.add(audit)
    db.commit()

    token = create_access_token({"sub": new_user.id, "email": new_user.email, "role": new_user.role})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "email": new_user.email,
            "full_name": new_user.full_name,
            "role": new_user.role
        }
    }

@router.get("/me")
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    res = {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "created_at": current_user.created_at.isoformat() if current_user.created_at else None
    }
    if current_user.role == "WORKER" and current_user.worker_profile:
        wp = current_user.worker_profile
        res["profile"] = {
            "phone": wp.phone,
            "aadhaar_masked": wp.aadhaar_masked,
            "preferred_language": wp.preferred_language,
            "years_experience": wp.years_experience,
            "trade_preference": wp.trade_preference,
            "address": wp.address
        }
    elif current_user.role == "ASSESSOR" and current_user.assessor_profile:
        ap = current_user.assessor_profile
        res["profile"] = {
            "employee_id": ap.employee_id,
            "authorized_trades": ap.authorized_trades,
            "accreditation_number": ap.accreditation_number,
            "organization": ap.organization
        }
    return res
