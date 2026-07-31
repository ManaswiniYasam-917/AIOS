import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from backend.config import settings

# Secure PBKDF2 implementation using hashlib
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain text password using PBKDF2."""
    return get_password_hash(plain_password) == hashed_password

def get_password_hash(password: str) -> str:
    """Generates a PBKDF2 hash from a password."""
    # Standard static salt for sandbox simplicity. In custom environments, salt is saved per user.
    salt = b"aios_enterprise_cryptographic_pbkdf2_salt_328"
    key = hashlib.pbkdf2_hmac(
        'sha256', 
        password.encode('utf-8'), 
        salt, 
        100000 # Iterations
    )
    return key.hex()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Generates a signed JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[dict]:
    """Decodes a JWT and verifies its signature."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user_role(token: Optional[str] = Depends(oauth2_scheme)) -> Dict[str, str]:
    """
    Retrieves the identity details from the active session.
    Provides fallback mock identity if no token is provided to match the SPA dashboard simulation style.
    """
    if not token:
        # Fallback simulation profile
        return {"email": "manaswiniyasam617@gmail.com", "role": "Super Admin"}
        
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    email: str = payload.get("sub")
    role: str = payload.get("role", "Viewer")
    
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )
        
    return {"email": email, "role": role}
