from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Text, DateTime, Float, Boolean, ForeignKey
)
from sqlalchemy.orm import relationship
from database import Base


class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    badge_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(120), nullable=False)
    station = Column(String(120), default="")
    role = Column(String(50), default="Officer")  # Officer, Inspector, Admin
    hashed_password = Column(String(255), nullable=False)
    is_online = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    cases = relationship("Case", back_populates="officer")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    case_number = Column(String(50), unique=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, default="")
    status = Column(String(30), default="Open")     # Open, Under Investigation, Closed
    priority = Column(String(20), default="Medium")  # Low, Medium, High, Critical
    location = Column(String(255), default="")
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    date_filed = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    officer = relationship("Officer", back_populates="cases")

    @property
    def officer_name(self):
        return self.officer.name if self.officer else None


class MissingPerson(Base):
    __tablename__ = "missing_persons"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    age = Column(Integer, nullable=True)
    gender = Column(String(20), default="")
    height_cm = Column(Integer, nullable=True)
    identifying_marks = Column(Text, default="")
    last_seen_location = Column(String(255), default="")
    last_seen_date = Column(DateTime, nullable=True)
    description = Column(Text, default="")
    photo_url = Column(String(500), default="")
    status = Column(String(30), default="Missing")  # Missing, Found, Closed
    reported_by = Column(String(120), default="")
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    plate_number = Column(String(30), unique=True, index=True, nullable=False)
    make = Column(String(80), default="")
    model = Column(String(80), default="")
    color = Column(String(40), default="")
    owner_name = Column(String(120), default="")
    status = Column(String(30), default="Clear")  # Clear, Stolen, Flagged, Suspended
    notes = Column(Text, default="")
    reported_date = Column(DateTime, default=datetime.utcnow)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=True)


class CriminalRecord(Base):
    __tablename__ = "criminal_records"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    aliases = Column(String(255), default="")
    age = Column(Integer, nullable=True)
    gender = Column(String(20), default="")
    charges = Column(Text, default="")
    status = Column(String(30), default="Wanted")  # Wanted, In Custody, Released, Cleared
    last_known_location = Column(String(255), default="")
    photo_url = Column(String(500), default="")
    risk_level = Column(String(20), default="Medium")  # Low, Medium, High
    created_at = Column(DateTime, default=datetime.utcnow)


class LiveLocation(Base):
    """Live officer / unit positions shown on the dashboard map."""
    __tablename__ = "live_locations"

    id = Column(Integer, primary_key=True, index=True)
    label = Column(String(120), nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    status = Column(String(30), default="patrol")  # patrol, responding, case-site
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class AIQueryLog(Base):
    """Every Sherlock AI / Smart Scan query is logged for audit purposes."""
    __tablename__ = "ai_query_logs"

    id = Column(Integer, primary_key=True, index=True)
    officer_id = Column(Integer, ForeignKey("officers.id"), nullable=True)
    query_type = Column(String(30), default="chat")  # chat, smart_scan_text, smart_scan_image
    query_text = Column(Text, default="")
    response_text = Column(Text, default="")
    created_at = Column(DateTime, default=datetime.utcnow)