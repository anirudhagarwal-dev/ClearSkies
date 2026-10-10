"""
Authentication & User Profile Endpoints (JWT + BCrypt)
- POST /auth/register
- POST /auth/login
- GET /users/me
"""
from typing import Optional
from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.db.models import User
from app.core.security import get_password_hash, verify_password, create_access_token, oauth2_scheme, decode_access_token
from app.core.errors import create_problem_response

router = APIRouter(tags=["Authentication"])

class RegisterRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=150, description="Email address")
    password: str = Field(..., min_length=8, description="Password min 8 chars")
    displayName: str = Field(..., min_length=2, max_length=100)

class LoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=150, description="Email address")
    password: str

def get_current_user(token: Optional[str] = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

@router.post("/auth/register")
def register(request: Request, body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == body.email.lower()).first()
    if existing:
        return create_problem_response(
            request=request,
            status_code=409,
            title="Email Already Registered",
            detail=f"An account with email '{body.email}' already exists.",
            code="USER_ALREADY_EXISTS"
        )
        
    user = User(
        email=body.email.lower(),
        password_hash=get_password_hash(body.password),
        display_name=body.displayName,
        role="USER"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token(subject=user.id, role=user.role)
    return {
        "userId": user.id,
        "email": user.email,
        "displayName": user.display_name,
        "role": user.role,
        "accessToken": token,
        "tokenType": "bearer"
    }

@router.post("/auth/login")
def login(request: Request, body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.password_hash):
        return create_problem_response(
            request=request,
            status_code=401,
            title="Invalid Credentials",
            detail="Incorrect email or password.",
            code="INVALID_CREDENTIALS"
        )
        
    token = create_access_token(subject=user.id, role=user.role)
    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "displayName": user.display_name,
            "role": user.role
        }
    }

@router.get("/users/me")
def get_profile(request: Request, db: Session = Depends(get_db), token: Optional[str] = Depends(oauth2_scheme)):
    if not token:
        return create_problem_response(
            request=request,
            status_code=401,
            title="Unauthorized",
            detail="Authentication token is missing.",
            code="MISSING_TOKEN"
        )
    payload = decode_access_token(token)
    if not payload:
        return create_problem_response(
            request=request,
            status_code=401,
            title="Unauthorized",
            detail="Authentication token is expired or invalid.",
            code="INVALID_TOKEN"
        )
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        return create_problem_response(
            request=request,
            status_code=404,
            title="User Not Found",
            detail="User record could not be found.",
            code="USER_NOT_FOUND"
        )
    return {
        "id": user.id,
        "email": user.email,
        "displayName": user.display_name,
        "role": user.role,
        "createdAt": user.created_at.isoformat()
    }
