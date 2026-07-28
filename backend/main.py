import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
import models  # noqa: F401  (ensures models are registered before create_all)

from routers import (
    auth_router, cases, missing_persons, vehicles, criminals,
    dashboard, analytics, ai_assistant, smart_scan,
)

load_dotenv()

# Creates sherlock.db and all tables automatically on first run
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SherlockBot API",
    description="Local backend for the Sherlock AI Police OS dashboard.",
    version="1.0.0",
)

frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5175")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:5173", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(cases.router)
app.include_router(missing_persons.router)
app.include_router(vehicles.router)
app.include_router(criminals.router)
app.include_router(dashboard.router)
app.include_router(analytics.router)
app.include_router(ai_assistant.router)
app.include_router(smart_scan.router)


@app.get("/")
def root():
    return {
        "status": "online",
        "service": "SherlockBot API",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
