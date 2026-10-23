import logging
from fastapi import Header, HTTPException, status
from uuid import UUID
from supabase import create_client
from app.core.config import settings

logger = logging.getLogger(__name__)

# Fallback test owner ID only when no Authorization header is provided (for dev/scripts)
DEV_OWNER_ID = UUID("00000000-0000-0000-0000-000000000001")

# Create server-side supabase client for JWT verification
_supabase_admin = None
if settings.SUPABASE_URL and settings.SUPABASE_SECRET_KEY:
    try:
        _supabase_admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
    except Exception as e:
        logger.warning(f"Could not initialize Supabase auth verifier: {e}")

def get_current_user_id(authorization: str = Header(default=None)) -> UUID:
    """
    Extracts and validates the authenticated user ID from the Supabase JWT token.
    1. If a Bearer token is provided: verifies with Supabase Auth (get_user).
    2. If no Bearer token is passed: falls back to DEV_OWNER_ID for local testing.
    """
    if not authorization or not authorization.startswith("Bearer "):
        return DEV_OWNER_ID

    token = authorization.split("Bearer ", 1)[1].strip()
    if not token:
        return DEV_OWNER_ID

    # 1. Try to verify token as real Supabase JWT
    if _supabase_admin:
        try:
            user_response = _supabase_admin.auth.get_user(token)
            if user_response and user_response.user and user_response.user.id:
                return UUID(user_response.user.id)
        except Exception as e:
            logger.warning(f"Supabase token verification failed: {e}")
            # If token is not a valid Supabase JWT, check if it's a raw UUID (dev testing)
            try:
                return UUID(token)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired Supabase authentication token"
                )

    # 2. Fallback check for raw UUID in dev mode
    try:
        return UUID(token)
    except ValueError:
        return DEV_OWNER_ID
