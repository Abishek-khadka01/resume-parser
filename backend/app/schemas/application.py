from pydantic import BaseModel
from typing import Optional, Any
from datetime import datetime
from uuid import UUID


class ApplicationCreate(BaseModel):
    job_id: str
    job_title: str
    company_name: str
    company_logo_url: Optional[str] = None
    match_score: Optional[int] = None
    status: str = "saved"
    notes: Optional[str] = None
    job_data: Optional[Any] = None


class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    notes: Optional[str] = None


class ApplicationOut(BaseModel):
    id: UUID
    user_id: UUID
    job_id: str
    job_title: str
    company_name: str
    company_logo_url: Optional[str] = None
    match_score: Optional[int] = None
    status: str
    notes: Optional[str] = None
    applied_at: Optional[datetime] = None
    status_updated_at: datetime
    created_at: datetime
    job_data: Optional[Any] = None
    model_config = {"from_attributes": True}
