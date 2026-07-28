import random
from datetime import datetime
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_officer

router = APIRouter(prefix="/api/cases", tags=["Cases"])


def _generate_case_number(db: Session) -> str:
    year = datetime.utcnow().year
    while True:
        candidate = f"CASE-{year}-{random.randint(1000, 9999)}"
        if not db.query(models.Case).filter(models.Case.case_number == candidate).first():
            return candidate


@router.get("", response_model=List[schemas.CaseOut])
def list_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    query = db.query(models.Case)
    if status:
        query = query.filter(models.Case.status == status)
    if priority:
        query = query.filter(models.Case.priority == priority)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (models.Case.title.ilike(like)) | (models.Case.description.ilike(like))
        )
    return query.order_by(models.Case.date_filed.desc()).all()


@router.post("", response_model=schemas.CaseOut)
def create_case(
    case_in: schemas.CaseCreate,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    case = models.Case(
        **case_in.model_dump(),
        case_number=_generate_case_number(db),
        officer_id=current_officer.id,
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}", response_model=schemas.CaseOut)
def get_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.put("/{case_id}", response_model=schemas.CaseOut)
def update_case(
    case_id: int,
    case_in: schemas.CaseUpdate,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    for field, value in case_in.model_dump(exclude_unset=True).items():
        setattr(case, field, value)
    case.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}")
def delete_case(
    case_id: int,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    case = db.query(models.Case).filter(models.Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
    return {"detail": "Case deleted"}
