from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_officer

router = APIRouter(prefix="/api/criminals", tags=["Criminal Database"])


@router.get("", response_model=List[schemas.CriminalRecordOut])
def list_criminals(
    status: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    query = db.query(models.CriminalRecord)
    if status:
        query = query.filter(models.CriminalRecord.status == status)
    if risk_level:
        query = query.filter(models.CriminalRecord.risk_level == risk_level)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (models.CriminalRecord.name.ilike(like))
            | (models.CriminalRecord.aliases.ilike(like))
            | (models.CriminalRecord.charges.ilike(like))
        )
    return query.order_by(models.CriminalRecord.created_at.desc()).all()


@router.post("", response_model=schemas.CriminalRecordOut)
def create_criminal(
    record_in: schemas.CriminalRecordCreate,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    record = models.CriminalRecord(**record_in.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/{record_id}", response_model=schemas.CriminalRecordOut)
def get_criminal(
    record_id: int,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    record = db.query(models.CriminalRecord).filter(models.CriminalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    return record


@router.put("/{record_id}", response_model=schemas.CriminalRecordOut)
def update_criminal(
    record_id: int,
    record_in: schemas.CriminalRecordUpdate,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    record = db.query(models.CriminalRecord).filter(models.CriminalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    for field, value in record_in.model_dump(exclude_unset=True).items():
        setattr(record, field, value)
    db.commit()
    db.refresh(record)
    return record


@router.delete("/{record_id}")
def delete_criminal(
    record_id: int,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    record = db.query(models.CriminalRecord).filter(models.CriminalRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(record)
    db.commit()
    return {"detail": "Record deleted"}
