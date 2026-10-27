from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, files, downloads

app = FastAPI(
    title="CloudVault API",
    description="Secure Cloud File Storage with File Segmentation, Encryption (AES-256-GCM), and Reconstruction",
    version="1.0.0"
)

# CORS configuration supporting Vercel, local testing, and configured FRONTEND_ORIGIN
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(health.router, prefix="/api/v1")
app.include_router(files.router, prefix="/api/v1")
app.include_router(downloads.router, prefix="/api/v1")

@app.get("/")
def root():
    return {
        "message": "Welcome to CloudVault API",
        "docs": "/docs",
        "health": "/api/v1/health"
    }
