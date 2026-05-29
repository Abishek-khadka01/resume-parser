import resend
from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY


async def send_job_alert_email(to: str, jobs: list, alert_keywords: list[str]) -> None:
    if not jobs:
        return

    items_html = "".join(
        f"<li><strong>{j.get('job_title')}</strong> at {j.get('employer_name')} "
        f"— Match: {j.get('match_score', '?')}% "
        f"<a href='{j.get('job_apply_link', '#')}'>Apply</a></li>"
        for j in jobs[:10]
    )

    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": [to],
        "subject": f"New job matches for: {', '.join(alert_keywords)}",
        "html": f"""
        <h2>Your ResumeMatch Job Alert</h2>
        <p>We found {len(jobs)} new job(s) matching your alert.</p>
        <ul>{items_html}</ul>
        <p><small>You're receiving this because you set up a job alert on ResumeMatch.
        <a href='#'>Unsubscribe</a></small></p>
        """,
    })
