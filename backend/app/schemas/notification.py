from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
from uuid import UUID


class NotificationOut(BaseModel):
    id: UUID
    alert_id: Optional[UUID] = None
    job_id: Optional[str] = None
    title: str
    message: str
    job_data: Optional[Dict[str, Any]] = None
    match_score: Optional[int] = None
    is_read: bool
    created_at: datetime
    model_config = {"from_attributes": True}
