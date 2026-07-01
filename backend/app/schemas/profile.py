from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import date
from uuid import UUID


class WorkExperienceOut(BaseModel):
    id: UUID
    company: str
    title: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    description: Optional[str] = None
    model_config = {"from_attributes": True}


class EducationOut(BaseModel):
    id: UUID
    institution: str
    degree: Optional[str] = None
    field: Optional[str] = None
    graduation_year: Optional[int] = None
    model_config = {"from_attributes": True}


class ProfileOut(BaseModel):
    id: UUID
    user_id: UUID
    full_name: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    desired_title: Optional[str] = None
    work_model: Optional[str] = None
    experience_level: Optional[str] = None
    work_authorization: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills: List[str] = []
    skills_categorized: Optional[Dict[str, List[str]]] = None
    completeness_pct: int = 0
    resume_url: Optional[str] = None
    resume_uploaded: bool = False
    resume_locked_fields: List[str] = []
    work_experience: List[WorkExperienceOut] = []
    education: List[EducationOut] = []
    model_config = {"from_attributes": True}


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    linkedin_url: Optional[str] = None
    location: Optional[str] = None
    desired_title: Optional[str] = None
    work_model: Optional[str] = None
    experience_level: Optional[str] = None
    work_authorization: Optional[str] = None
    salary_min: Optional[int] = None
    salary_max: Optional[int] = None
    skills: Optional[List[str]] = None
