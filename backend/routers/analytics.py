from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
from database import get_db
from auth import get_current_officer

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/overview")
def overview(
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    cases = db.query(models.Case).all()
    status_counts = Counter(c.status for c in cases)
    priority_counts = Counter(c.priority for c in cases)

    criminals = db.query(models.CriminalRecord).all()
    risk_counts = Counter(c.risk_level for c in criminals)

    vehicles = db.query(models.Vehicle).all()
    vehicle_status_counts = Counter(v.status for v in vehicles)

    # cases filed per month (last data available), useful for a trend chart
    monthly = Counter(c.date_filed.strftime("%Y-%m") for c in cases)

    return {
        "cases_by_status": dict(status_counts),
        "cases_by_priority": dict(priority_counts),
        "cases_by_month": dict(sorted(monthly.items())),
        "criminals_by_risk": dict(risk_counts),
        "vehicles_by_status": dict(vehicle_status_counts),
        "total_officers": db.query(models.Officer).count(),
    }
