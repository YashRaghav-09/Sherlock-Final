from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import (
    verify_password, hash_password, create_access_token, get_current_officer
)

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=schemas.OfficerOut)
def register(officer_in: schemas.OfficerCreate, db: Session = Depends(get_db)):
    existing = db.query(models.Officer).filter(
        models.Officer.badge_id == officer_in.badge_id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Badge ID already registered")

    officer = models.Officer(
        badge_id=officer_in.badge_id,
        name=officer_in.name,
        station=officer_in.station,
        role=officer_in.role,
        hashed_password=hash_password(officer_in.password),
    )
    db.add(officer)
    db.commit()
    db.refresh(officer)
    return officer


@router.post("/login", response_model=schemas.Token)
def login(credentials: schemas.OfficerLogin, db: Session = Depends(get_db)):
    officer = db.query(models.Officer).filter(
        models.Officer.badge_id == credentials.badge_id
    ).first()
    if not officer or not verify_password(credentials.password, officer.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect badge ID or password",
        )

    officer.is_online = True
    db.commit()

    token = create_access_token({"sub": officer.badge_id})
    return {"access_token": token, "token_type": "bearer", "officer": officer}


@router.get("/me", response_model=schemas.OfficerOut)
def me(current_officer: models.Officer = Depends(get_current_officer)):
    return current_officer
