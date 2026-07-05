import logging
from contextlib import asynccontextmanager

from starlette.middleware.sessions import SessionMiddleware
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from app.core.database import Base, engine
from app.routers import auth, profile, resume, jobs, applications, alerts, notifications, google
from app.services.alert_scheduler import run_alert_checks
from os import environ as env
from dotenv import load_dotenv

Base.metadata.create_all(bind=engine)
load_dotenv()

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        run_alert_checks,
        "interval",
        minutes=5,
        id="job_alert_checks",
    )
    scheduler.start()
    logger.info("Job alert scheduler started (checks every 5 minutes)")
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="ResumeMatch API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.add_middleware(
    SessionMiddleware,
    secret_key=env.get("SECRET_KEY"),
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(profile.router, prefix="/api/profile", tags=["profile"])
app.include_router(resume.router, prefix="/api/resume", tags=["resume"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(applications.router, prefix="/api/applications", tags=["applications"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["alerts"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])

app.include_router(google.router, prefix="/api/google", tags=["google"])

@app.get("/api/health")
def health():
    return {"status": "ok"}
