"""
Firebase Phone Authentication Service
Verifies Firebase ID tokens and manages user roles.
"""

import os
import json
import httpx
from typing import Optional, Dict, Any
from datetime import datetime

# Firebase project configuration
FIREBASE_PROJECT_ID = os.getenv("FIREBASE_PROJECT_ID", "")

# Role definitions
VALID_ROLES = {"admin", "supervisor", "worker"}
DEFAULT_ROLE = "worker"

# Admin phone numbers (pre-configured admins)
# Add your admin phone numbers here
ADMIN_PHONES = {
    "+919876543210",  # Example admin
    "+911234567890",  # Example admin
    "+911111111111",  # Test admin
}

# Supervisor phone numbers
SUPERVISOR_PHONES = {
    "+919999999999",  # Example supervisor
    "+912222222222",  # Test supervisor
}

# Worker phone numbers (default for all others)
# Any phone not in ADMIN_PHONES or SUPERVISOR_PHONES gets 'worker' role


async def verify_firebase_token(id_token: str) -> Optional[Dict[str, Any]]:
    """
    Verify Firebase ID token using Google's public keys.
    Returns decoded token payload if valid, None otherwise.
    """
    if not FIREBASE_PROJECT_ID:
        print("[Firebase] Warning: FIREBASE_PROJECT_ID not set, using dev mode")
        return None
    
    try:
        # Verify token with Firebase Auth REST API
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key={os.getenv('FIREBASE_API_KEY', '')}"
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url,
                json={"idToken": id_token}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("users"):
                    user_data = data["users"][0]
                    return {
                        "uid": user_data.get("localId"),
                        "phone_number": user_data.get("phoneNumber"),
                        "email": user_data.get("email"),
                        "email_verified": user_data.get("emailVerified", False),
                    }
            
            print(f"[Firebase] Token verification failed: {response.text}")
            return None
            
    except Exception as e:
        print(f"[Firebase] Error verifying token: {e}")
        return None


def determine_role(phone_number: str) -> str:
    """
    Determine user role based on phone number.
    In production, this should check against a database or admin panel.
    """
    if phone_number in ADMIN_PHONES:
        return "admin"
    elif phone_number in SUPERVISOR_PHONES:
        return "supervisor"
    return DEFAULT_ROLE


def generate_otp() -> str:
    """Generate a 6-digit OTP for development/testing."""
    import random
    return str(random.randint(100000, 999999))


# Store OTPs temporarily (in production, use Redis or similar)
_otp_store: Dict[str, Dict[str, Any]] = {}


def store_otp(phone_number: str, otp: str) -> None:
    """Store OTP for verification."""
    _otp_store[phone_number] = {
        "otp": otp,
        "created_at": datetime.utcnow(),
        "attempts": 0
    }
    # Print to terminal for testing
    print(f"\n{'='*50}")
    print(f"📱 OTP for {phone_number}: {otp}")
    print(f"{'='*50}\n")


def verify_otp(phone_number: str, otp: str) -> bool:
    """Verify OTP for a phone number."""
    stored = _otp_store.get(phone_number)
    if not stored:
        return False
    
    # Check attempts (max 3)
    if stored["attempts"] >= 3:
        del _otp_store[phone_number]
        return False
    
    stored["attempts"] += 1
    
    # Check expiry (5 minutes)
    elapsed = (datetime.utcnow() - stored["created_at"]).total_seconds()
    if elapsed > 300:
        del _otp_store[phone_number]
        return False
    
    # Verify OTP
    if stored["otp"] == otp:
        del _otp_store[phone_number]
        return True
    
    return False


def clear_expired_otps() -> None:
    """Clear expired OTPs from store."""
    now = datetime.utcnow()
    expired = [
        phone for phone, data in _otp_store.items()
        if (now - data["created_at"]).total_seconds() > 300
    ]
    for phone in expired:
        del _otp_store[phone]
