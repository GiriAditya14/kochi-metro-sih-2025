"""
Simple email/password auth with roles (admin, supervisor, worker).
Generates HMAC-signed tokens (JWT-like) without external deps.
"""

import os
import json
import hmac
import base64
import hashlib
import time
from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from ..models import get_db, User

SECRET_KEY = os.getenv("APP_SECRET_KEY", "dev-secret-change-me")
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days
security = HTTPBearer()


# ---------- password helpers ----------
def hash_password(password: str) -> str:
    salt = os.urandom(16)
    salted = salt + password.encode("utf-8")
    digest = hashlib.sha256(salted).digest()
    return base64.urlsafe_b64encode(salt).decode() + "$" + base64.urlsafe_b64encode(digest).decode()


def verify_password(password: str, stored: str) -> bool:
    try:
        salt_b64, digest_b64 = stored.split("$")
        salt = base64.urlsafe_b64decode(salt_b64.encode())
        expected = base64.urlsafe_b64decode(digest_b64.encode())
        test = hashlib.sha256(salt + password.encode("utf-8")).digest()
        return hmac.compare_digest(test, expected)
    except Exception:
        return False


# ---------- token helpers ----------
def _b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_json(obj) -> str:
    return _b64url(json.dumps(obj, separators=(",", ":")).encode())


def create_token(user: User) -> str:
    header = {"alg": "HS256", "typ": "JWT"}
    payload = {
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "exp": int(time.time()) + TOKEN_TTL_SECONDS,
    }
    unsigned = f"{_b64url_json(header)}.{_b64url_json(payload)}"
    sig = hmac.new(SECRET_KEY.encode(), unsigned.encode(), hashlib.sha256).digest()
    return f"{unsigned}.{_b64url(sig)}"


def decode_token(token: str) -> dict:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            raise ValueError("Invalid token")
        unsigned = ".".join(parts[0:2])
        sig = parts[2]
        expected = _b64url(hmac.new(SECRET_KEY.encode(), unsigned.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            raise ValueError("Bad signature")
        payload_json = base64.urlsafe_b64decode(parts[1] + "==")
        payload = json.loads(payload_json)
        if payload.get("exp") and time.time() > payload["exp"]:
            raise ValueError("Expired")
        return payload
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)) -> User:
    token = credentials.credentials
    payload = decode_token(token)
    user = db.query(User).filter(User.id == payload.get("sub")).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_role(roles):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required: {roles}"
            )
        return current_user
    return checker

