import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Date, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    linkedin_url = Column(String, nullable=True)
    location = Column(String, nullable=True)
    desired_title = Column(String, nullable=True)
    work_model = Column(SAEnum("remote", "hybrid", "on-site", name="work_model_enum"), nullable=True)
    experience_level = Column(SAEnum("entry", "mid", "senior", "lead", name="exp_level_enum"), nullable=True)
    work_authorization = Column(String, nullable=True)
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    skills = Column(ARRAY(String), default=list)
    skills_categorized = Column(JSONB, nullable=True)
    completeness_pct = Column(Integer, default=0)
    resume_url = Column(String, nullable=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship("User", back_populates="profile")
    work_experience = relationship("WorkExperience", back_populates="profile", cascade="all, delete-orphan")
    education = relationship("Education", back_populates="profile", cascade="all, delete-orphan")


class WorkExperience(Base):
    __tablename__ = "work_experiences"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    company = Column(String, nullable=False)
    title = Column(String, nullable=False)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)

    profile = relationship("Profile", back_populates="work_experience")


class Education(Base):
    __tablename__ = "education"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=False)
    institution = Column(String, nullable=False)
    degree = Column(String, nullable=True)
    field = Column(String, nullable=True)
    graduation_year = Column(Integer, nullable=True)

    profile = relationship("Profile", back_populates="education")
