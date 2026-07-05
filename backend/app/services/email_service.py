import resend
from app.core.config import settings

resend.api_key = settings.RESEND_API_KEY

_BRAND_PRIMARY = "#5b1660"
_BRAND_PRIMARY_DARK = "#451149"
_BG = "#faf9f7"
_CARD = "#ffffff"
_FOREGROUND = "#211a27"
_MUTED = "#726c78"
_BORDER = "#e7e2e7"
_NAVBAR = "#211228"


def _score_color(score) -> tuple[str, str]:
    """Returns (text_color, bg_color) matching the app's match-score convention."""
    try:
        score = float(score)
    except (TypeError, ValueError):
        score = 0
    if score >= 8:
        return "#16a34a", "#f0fdf4"
    if score >= 5:
        return "#ca8a04", "#fefce8"
    return "#dc2626", "#fef2f2"


def _job_card_html(job: dict) -> str:
    title = job.get("job_title") or "Untitled role"
    company = job.get("employer_name") or "A company"
    location = job.get("job_city") or job.get("job_country") or ("Remote" if job.get("job_is_remote") else "")
    score = job.get("match_score", 0)
    text_color, bg_color = _score_color(score)
    apply_link = job.get("job_apply_link") or "#"
    description = (job.get("job_description") or "")[:160].strip()
    if len(job.get("job_description") or "") > 160:
        description += "…"

    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="border:1px solid {_BORDER}; border-radius:12px; margin-bottom:14px;">
      <tr>
        <td style="padding:18px 20px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="vertical-align:top;">
                <p style="margin:0 0 4px 0; font-size:15px; font-weight:700; color:{_FOREGROUND};">
                  {title}
                </p>
                <p style="margin:0; font-size:13px; color:{_MUTED};">
                  {company}{' · ' + location if location else ''}
                </p>
              </td>
              <td style="vertical-align:top; text-align:right; white-space:nowrap;">
                <span style="display:inline-block; padding:4px 10px; border-radius:999px; font-size:13px; font-weight:700; color:{text_color}; background:{bg_color};">
                  {score}/10 match
                </span>
              </td>
            </tr>
          </table>
          {f'<p style="margin:10px 0 0 0; font-size:13px; color:{_MUTED}; line-height:1.5;">{description}</p>' if description else ''}
          <a href="{apply_link}"
             style="display:inline-block; margin-top:14px; padding:9px 18px; border-radius:8px; background:{_BRAND_PRIMARY}; color:#ffffff; font-size:13px; font-weight:600; text-decoration:none;">
            View &amp; Apply
          </a>
        </td>
      </tr>
    </table>
    """


async def send_job_alert_email(to: str, jobs: list, alert_keywords: list[str]) -> None:
    if not jobs:
        return

    keyword_text = ", ".join(alert_keywords) if alert_keywords else "your saved search"
    job_count = len(jobs)
    cards_html = "".join(_job_card_html(job) for job in jobs[:10])

    html = f"""
    <div style="background:{_BG}; padding:32px 16px; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto;">
        <tr>
          <td style="background:{_NAVBAR}; border-radius:16px 16px 0 0; padding:24px 28px;">
            <span style="font-size:20px; font-weight:800; color:#ffffff; letter-spacing:0.5px;">ResuMatrix</span>
          </td>
        </tr>
        <tr>
          <td style="background:{_CARD}; padding:28px; border:1px solid {_BORDER}; border-top:none;">
            <p style="margin:0 0 4px 0; font-size:18px; font-weight:700; color:{_FOREGROUND};">
              {job_count} new job{'s' if job_count != 1 else ''} matching "{keyword_text}"
            </p>
            <p style="margin:0 0 22px 0; font-size:13px; color:{_MUTED};">
              We found these while you were away — ranked by how well they fit your profile.
            </p>
            {cards_html}
          </td>
        </tr>
        <tr>
          <td style="background:{_CARD}; border-radius:0 0 16px 16px; padding:20px 28px; border:1px solid {_BORDER}; border-top:none;">
            <p style="margin:0; font-size:12px; color:{_MUTED}; line-height:1.6;">
              You're receiving this because you set up a job alert on ResuMatrix.
              <a href="#" style="color:{_BRAND_PRIMARY_DARK};">Manage alerts</a>
              ·
              <a href="#" style="color:{_BRAND_PRIMARY_DARK};">Unsubscribe</a>
            </p>
          </td>
        </tr>
      </table>
    </div>
    """

    resend.Emails.send({
        "from": settings.EMAIL_FROM,
        "to": [to],
        "subject": f"{job_count} new job match{'es' if job_count != 1 else ''} for \"{keyword_text}\"",
        "html": html,
    })
