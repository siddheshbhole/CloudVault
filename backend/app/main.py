from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import health, files, downloads

app = FastAPI(
    title="CloudVault API",
    description="Secure Cloud File Storage with File Segmentation, Encryption (AES-256-GCM), and Reconstruction",
    version="1.0.0"
)

# CORS configuration supporting comma-separated origins, localhost, and Vercel
frontend_origins = [orig.strip() for orig in settings.FRONTEND_ORIGIN.split(",") if orig.strip()]
for default_orig in ["http://localhost:5173", "http://127.0.0.1:5173"]:
    if default_orig not in frontend_origins:
        frontend_origins.append(default_orig)

app.add_middleware(
    CORSMiddleware,
    allow_origins=frontend_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Automatically allows all Vercel preview & production deployments
    allow_credentials=True,
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
