from typing import List

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_officer

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def summary(
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    total_cases = db.query(models.Case).count()
    open_cases = db.query(models.Case).filter(models.Case.status == "Open").count()
    under_investigation = db.query(models.Case).filter(
        models.Case.status == "Under Investigation"
    ).count()
    closed_cases = db.query(models.Case).filter(models.Case.status == "Closed").count()

    missing_active = db.query(models.MissingPerson).filter(
        models.MissingPerson.status == "Missing"
    ).count()
    missing_found = db.query(models.MissingPerson).filter(
        models.MissingPerson.status == "Found"
    ).count()

    stolen_vehicles = db.query(models.Vehicle).filter(models.Vehicle.status == "Stolen").count()
    flagged_vehicles = db.query(models.Vehicle).filter(models.Vehicle.status == "Flagged").count()

    wanted_criminals = db.query(models.CriminalRecord).filter(
        models.CriminalRecord.status == "Wanted"
    ).count()
    in_custody = db.query(models.CriminalRecord).filter(
        models.CriminalRecord.status == "In Custody"
    ).count()

    return {
        "cases": {
            "total": total_cases,
            "open": open_cases,
            "under_investigation": under_investigation,
            "closed": closed_cases,
        },
        "missing_persons": {
            "active": missing_active,
            "found": missing_found,
        },
        "vehicles": {
            "stolen": stolen_vehicles,
            "flagged": flagged_vehicles,
        },
        "criminals": {
            "wanted": wanted_criminals,
            "in_custody": in_custody,
        },
        "notifications_count": wanted_criminals + missing_active,
    }


@router.get("/live-locations", response_model=List[schemas.LiveLocationOut])
def live_locations(
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    return db.query(models.LiveLocation).all()
