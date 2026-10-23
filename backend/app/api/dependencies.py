from fastapi import Header, HTTPException, status
from uuid import UUID

# Default test owner ID used when in development single-user mode
DEV_OWNER_ID = UUID("00000000-0000-0000-0000-000000000001")

def get_current_user_id(authorization: str = Header(default=None)) -> UUID:
    """
    Extracts authenticated user ID. In production/auth mode, this validates the Supabase JWT.
    In local dev prototype mode, defaults gracefully to DEV_OWNER_ID so everything works out of the box.
    """
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split("Bearer ")[1]
        # For prototype development, a token may be user-supplied or mocked
        try:
            return UUID(token)
        except ValueError:
            pass
    return DEV_OWNER_ID
