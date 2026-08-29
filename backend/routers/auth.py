"""
routers/auth.py
----------------
Minimal JWT-based auth: signup + login. Passwords are hashed with
passlib (bcrypt). No email verification / password reset flow yet --
that's a natural next step once the core product loop works.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext

from config import settings
from database import get_db
from models import TokenResponse, UserLogin, UserPublic, UserSignup

router = APIRouter(prefix="/auth", tags=["auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def _create_access_token(user_id: str, role: str = "candidate") -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRY_MINUTES)
    payload = {"sub": user_id, "role": role, "exp": expire}
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_error
    except JWTError:
        raise credentials_error

    db = get_db()
    user = await db["users"].find_one({"_id": user_id})
    if user is None:
        raise credentials_error
    return user


def require_roles(allowed_roles: list[str]):
    """Role-Based Access Control dependency factory."""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role", "candidate")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {allowed_roles}, your role: {user_role}"
            )
        return current_user
    return role_checker


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: UserSignup):
    db = get_db()
    existing = await db["users"].find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user_doc = {
        "name": payload.name,
        "email": payload.email,
        "role": payload.role,
        "hashed_password": pwd_context.hash(payload.password),
    }
    created = await db["users"].insert_one(user_doc)
    token = _create_access_token(created["_id"], created.get("role", "candidate"))

    return TokenResponse(
        access_token=token,
        user=UserPublic(
            id=created["_id"],
            name=created["name"],
            email=created["email"],
            role=created.get("role", "candidate")
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: UserLogin):
    db = get_db()
    user = await db["users"].find_one({"email": payload.email})
    if not user or not pwd_context.verify(payload.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_role = user.get("role", "candidate")
    token = _create_access_token(user["_id"], user_role)
    return TokenResponse(
        access_token=token,
        user=UserPublic(id=user["_id"], name=user["name"], email=user["email"], role=user_role),
    )


@router.get("/me", response_model=UserPublic)
async def read_current_user(current_user: dict = Depends(get_current_user)):
    return UserPublic(
        id=current_user["_id"],
        name=current_user["name"],
        email=current_user["email"],
        role=current_user.get("role", "candidate")
    )
