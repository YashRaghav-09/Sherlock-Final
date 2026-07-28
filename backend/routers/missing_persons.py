from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_officer

router = APIRouter(prefix="/api/missing-persons", tags=["Missing Persons"])


@router.get("", response_model=List[schemas.MissingPersonOut])
def list_missing_persons(
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    query = db.query(models.MissingPerson)
    if status:
        query = query.filter(models.MissingPerson.status == status)
    if search:
        like = f"%{search}%"
        query = query.filter(
            (models.MissingPerson.name.ilike(like))
            | (models.MissingPerson.last_seen_location.ilike(like))
            | (models.MissingPerson.description.ilike(like))
        )
    return query.order_by(models.MissingPerson.created_at.desc()).all()


@router.post("", response_model=schemas.MissingPersonOut)
def create_missing_person(
    person_in: schemas.MissingPersonCreate,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    person = models.MissingPerson(**person_in.model_dump())
    db.add(person)
    db.commit()
    db.refresh(person)
    return person


@router.get("/{person_id}", response_model=schemas.MissingPersonOut)
def get_missing_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    person = db.query(models.MissingPerson).filter(models.MissingPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Missing person record not found")
    return person


@router.put("/{person_id}", response_model=schemas.MissingPersonOut)
def update_missing_person(
    person_id: int,
    person_in: schemas.MissingPersonUpdate,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    person = db.query(models.MissingPerson).filter(models.MissingPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Missing person record not found")
    for field, value in person_in.model_dump(exclude_unset=True).items():
        setattr(person, field, value)
    db.commit()
    db.refresh(person)
    return person


@router.delete("/{person_id}")
def delete_missing_person(
    person_id: int,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    person = db.query(models.MissingPerson).filter(models.MissingPerson.id == person_id).first()
    if not person:
        raise HTTPException(status_code=404, detail="Missing person record not found")
    db.delete(person)
    db.commit()
    return {"detail": "Missing person record deleted"}
