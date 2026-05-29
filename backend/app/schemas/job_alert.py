from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from uuid import UUID


class JobAlertCreate(BaseModel):
    keywords: List[str]
    location: Optional[str] = None
    work_model: Optional[str] = None
    min_match_pct: int = 60
    frequency: str = "daily"


class JobAlertUpdate(BaseModel):
    is_active: Optional[bool] = None
    keywords: Optional[List[str]] = None
    location: Optional[str] = None
    min_match_pct: Optional[int] = None
    frequency: Optional[str] = None


class JobAlertOut(BaseModel):
    id: UUID
    user_id: UUID
    keywords: List[str]
    location: Optional[str] = None
    work_model: Optional[str] = None
    min_match_pct: int
    frequency: str
    is_active: bool
    last_sent_at: Optional[datetime] = None
    created_at: datetime
    model_config = {"from_attributes": True}
