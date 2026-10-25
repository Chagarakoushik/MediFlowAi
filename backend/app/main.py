from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .config import settings
from .database import engine, Base, SessionLocal
from .seed_data import seed_database
from .routes import appointments, reminders, prompt_lab, automation, stats

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables on startup
    Base.metadata.create_all(bind=engine)
    
    # Auto seed initial fictional dataset if clean
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
        
    yield
    # Shutdown logic if any

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent Healthcare Follow-up Assistant with Gemini AI, Clinical Safety Guardrails, and n8n Automation.",
    lifespan=lifespan
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow development and production origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(appointments.router, prefix=settings.API_V1_STR)
app.include_router(reminders.router, prefix=settings.API_V1_STR)
app.include_router(prompt_lab.router, prefix=settings.API_V1_STR)
app.include_router(automation.router, prefix=settings.API_V1_STR)
app.include_router(stats.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "gemini_api_configured": settings.has_gemini_key,
        "active_mode": "Live Gemini API" if settings.has_gemini_key else "Demo Mode (Simulated AI)"
    }

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "database": "sqlite_connected",
        "gemini_configured": settings.has_gemini_key
    }
