import logging
from datetime import datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.job_alert import JobAlert
from app.models.notification import Notification
from app.models.profile import Profile
from app.models.user import User
from app.services import ats_service, email_service, job_service

logger = logging.getLogger(__name__)

_FREQUENCY_INTERVALS = {
    "instant": timedelta(minutes=0),
    "daily": timedelta(hours=24),
    "weekly": timedelta(days=7),
}
_MAX_NOTIFICATIONS_PER_RUN = 10


def _is_due(alert: JobAlert, now: datetime) -> bool:
    if not alert.is_active:
        return False
    if alert.last_sent_at is None:
        return True
    last_sent = alert.last_sent_at
    if last_sent.tzinfo is None:
        last_sent = last_sent.replace(tzinfo=timezone.utc)
    interval = _FREQUENCY_INTERVALS.get(alert.frequency, timedelta(hours=24))
    return now - last_sent >= interval


async def _check_alert(db, alert: JobAlert, now: datetime) -> None:
    profile = db.query(Profile).filter(Profile.user_id == alert.user_id).first()
    user = db.query(User).filter(User.id == alert.user_id).first()
    if not user:
        return

    query = " ".join(alert.keywords) if alert.keywords else (profile.desired_title if profile else None)
    if not query:
        return

    try:
        jobs, _ = await job_service.search_jobs(
            query=query,
            location=alert.location,
            remote_jobs_only=True if alert.work_model == "remote" else None,
            num_pages=2,
        )
    except job_service.JobSearchError:
        logger.warning("Alert %s: job search failed, skipping this run", alert.id)
        return

    if jobs and profile:
        jobs = await ats_service.score_jobs_batch(jobs, profile)
    else:
        for job in jobs:
            job["match_score"] = 0

    threshold_pct = alert.min_match_pct or 0
    matching = [j for j in jobs if (j.get("match_score", 0) * 10) >= threshold_pct]

    if matching:
        existing_job_ids = {
            row[0]
            for row in db.query(Notification.job_id)
            .filter(Notification.user_id == alert.user_id, Notification.job_id.isnot(None))
            .all()
        }
        new_jobs = [
            j for j in matching if j.get("job_id") and j["job_id"] not in existing_job_ids
        ][:_MAX_NOTIFICATIONS_PER_RUN]

        if new_jobs:
            for job in new_jobs:
                db.add(
                    Notification(
                        user_id=alert.user_id,
                        alert_id=alert.id,
                        job_id=job.get("job_id"),
                        title=f"New match: {job.get('job_title')}",
                        message=f"{job.get('employer_name') or 'A company'} · {job.get('match_score', 0)}/10 match",
                        job_data=job,
                        match_score=job.get("match_score"),
                    )
                )
            db.commit()

            try:
                await email_service.send_job_alert_email(user.email, new_jobs, alert.keywords)
            except Exception:
                logger.exception("Alert %s: failed to send notification email", alert.id)

    alert.last_sent_at = now
    db.commit()


async def run_alert_checks() -> None:
    """Checks every active JobAlert that is due, scores fresh listings against the
    owner's profile, and notifies (in-app + email) about jobs not seen before.
    Runs on a recurring scheduler tick — see main.py."""
    db = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        alerts = db.query(JobAlert).filter(JobAlert.is_active.is_(True)).all()
        due_alerts = [a for a in alerts if _is_due(a, now)]
        for alert in due_alerts:
            try:
                await _check_alert(db, alert, now)
            except Exception:
                logger.exception("Failed to process job alert %s", alert.id)
                db.rollback()
    finally:
        db.close()
