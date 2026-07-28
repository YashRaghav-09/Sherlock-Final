from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


# ---------- Auth ----------
class OfficerCreate(BaseModel):
    badge_id: str
    name: str
    password: str
    station: str = ""
    role: str = "Officer"


class OfficerLogin(BaseModel):
    badge_id: str
    password: str


class OfficerOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    badge_id: str
    name: str
    station: str
    role: str
    is_online: bool


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    officer: OfficerOut


# ---------- Cases ----------
class CaseBase(BaseModel):
    title: str
    description: str = ""
    status: str = "Open"
    priority: str = "Medium"
    location: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CaseCreate(CaseBase):
    pass


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    location: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class CaseOut(CaseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    case_number: str
    date_filed: datetime
    updated_at: datetime
    officer_id: Optional[int] = None
    officer_name: Optional[str] = None


# ---------- Missing Persons ----------
class MissingPersonBase(BaseModel):
    name: str
    age: Optional[int] = None
    gender: str = ""
    height_cm: Optional[int] = None
    identifying_marks: str = ""
    last_seen_location: str = ""
    last_seen_date: Optional[datetime] = None
    description: str = ""
    photo_url: str = ""
    status: str = "Missing"
    reported_by: str = ""
    case_id: Optional[int] = None


class MissingPersonCreate(MissingPersonBase):
    pass


class MissingPersonUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[int] = None
    identifying_marks: Optional[str] = None
    last_seen_location: Optional[str] = None
    last_seen_date: Optional[datetime] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None
    status: Optional[str] = None
    reported_by: Optional[str] = None
    case_id: Optional[int] = None


class MissingPersonOut(MissingPersonBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Vehicles ----------
class VehicleBase(BaseModel):
    plate_number: str
    make: str = ""
    model: str = ""
    color: str = ""
    owner_name: str = ""
    status: str = "Clear"
    notes: str = ""
    case_id: Optional[int] = None


class VehicleCreate(VehicleBase):
    pass


class VehicleUpdate(BaseModel):
    make: Optional[str] = None
    model: Optional[str] = None
    color: Optional[str] = None
    owner_name: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    case_id: Optional[int] = None


class VehicleOut(VehicleBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    reported_date: datetime


# ---------- Criminal Records ----------
class CriminalRecordBase(BaseModel):
    name: str
    aliases: str = ""
    age: Optional[int] = None
    gender: str = ""
    charges: str = ""
    status: str = "Wanted"
    last_known_location: str = ""
    photo_url: str = ""
    risk_level: str = "Medium"


class CriminalRecordCreate(CriminalRecordBase):
    pass


class CriminalRecordUpdate(BaseModel):
    name: Optional[str] = None
    aliases: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    charges: Optional[str] = None
    status: Optional[str] = None
    last_known_location: Optional[str] = None
    photo_url: Optional[str] = None
    risk_level: Optional[str] = None


class CriminalRecordOut(CriminalRecordBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: datetime


# ---------- Live Locations ----------
class LiveLocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    label: str
    latitude: float
    longitude: float
    status: str
    updated_at: datetime


# ---------- AI ----------
class AIChatRequest(BaseModel):
    message: str


class AIChatResponse(BaseModel):
    reply: str
class AIHistoryEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    query_type: str
    query_text: str
    response_text: str
    created_at: datetime


class SmartScanTextRequest(BaseModel):
    query: str


class SmartScanResult(BaseModel):
    summary: str
    matched_missing_persons: list[MissingPersonOut] = []
    matched_criminals: list[CriminalRecordOut] = []
    matched_vehicles: list[VehicleOut] = []