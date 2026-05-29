from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import uuid
from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.job_alert import JobAlert
from app.schemas.job_alert import JobAlertCreate, JobAlertUpdate, JobAlertOut

router = APIRouter()


@router.get("", response_model=List[JobAlertOut])
def list_alerts(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(JobAlert).filter(JobAlert.user_id == current_user.id).all()


@router.post("", response_model=JobAlertOut, status_code=201)
def create_alert(body: JobAlertCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = JobAlert(user_id=current_user.id, **body.model_dump())
    db.add(alert)
    db.commit()
    db.refresh(alert)
    return alert


@router.patch("/{alert_id}", response_model=JobAlertOut)
def update_alert(
    alert_id: uuid.UUID,
    body: JobAlertUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    alert = db.query(JobAlert).filter(JobAlert.id == alert_id, JobAlert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(alert, field, value)
    db.commit()
    db.refresh(alert)
    return alert


@router.delete("/{alert_id}", status_code=204)
def delete_alert(alert_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    alert = db.query(JobAlert).filter(JobAlert.id == alert_id, JobAlert.user_id == current_user.id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(alert)
    db.commit()
