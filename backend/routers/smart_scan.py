from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_officer
from ai import gemini_service

router = APIRouter(prefix="/api/smart-scan", tags=["Smart Scan"])

MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


def _search_all(db: Session, query: str, limit: int = 10):
    like = f"%{query}%"
    persons = db.query(models.MissingPerson).filter(
        (models.MissingPerson.name.ilike(like))
        | (models.MissingPerson.description.ilike(like))
        | (models.MissingPerson.last_seen_location.ilike(like))
        | (models.MissingPerson.identifying_marks.ilike(like))
    ).limit(limit).all()

    criminals = db.query(models.CriminalRecord).filter(
        (models.CriminalRecord.name.ilike(like))
        | (models.CriminalRecord.aliases.ilike(like))
        | (models.CriminalRecord.charges.ilike(like))
        | (models.CriminalRecord.last_known_location.ilike(like))
    ).limit(limit).all()

    vehicles = db.query(models.Vehicle).filter(
        (models.Vehicle.plate_number.ilike(like))
        | (models.Vehicle.make.ilike(like))
        | (models.Vehicle.model.ilike(like))
        | (models.Vehicle.color.ilike(like))
    ).limit(limit).all()

    return persons, criminals, vehicles


def _context_from_matches(persons, criminals, vehicles) -> str:
    parts = []
    if persons:
        parts.append("MISSING PERSONS:\n" + "\n".join(
            f"- {p.name}, {p.age}, last seen {p.last_seen_location}" for p in persons
        ))
    if criminals:
        parts.append("CRIMINAL RECORDS:\n" + "\n".join(
            f"- {c.name} ({c.aliases}) status={c.status}" for c in criminals
        ))
    if vehicles:
        parts.append("VEHICLES:\n" + "\n".join(
            f"- {v.plate_number} {v.color} {v.make} {v.model} status={v.status}" for v in vehicles
        ))
    return "\n\n".join(parts) if parts else "No matching records found."


@router.post("/text", response_model=schemas.SmartScanResult)
def smart_scan_text(
    req: schemas.SmartScanTextRequest,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    persons, criminals, vehicles = _search_all(db, req.query)
    context = _context_from_matches(persons, criminals, vehicles)

    try:
        summary = gemini_service.summarize_matches(req.query, context)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    db.add(models.AIQueryLog(
        officer_id=current_officer.id,
        query_type="smart_scan_text",
        query_text=req.query,
        response_text=summary,
    ))
    db.commit()

    return {
        "summary": summary,
        "matched_missing_persons": persons,
        "matched_criminals": criminals,
        "matched_vehicles": vehicles,
    }


@router.post("/image", response_model=schemas.SmartScanResult)
async def smart_scan_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, or WEBP images are supported")

    data = await file.read()
    if len(data) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail="Image too large (max 8 MB)")

    try:
        description = gemini_service.analyze_image(data, file.content_type)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    # Use the AI-generated description as a search query against the DB
    persons, criminals, vehicles = _search_all(db, description[:100])
    context = _context_from_matches(persons, criminals, vehicles)

    try:
        summary = gemini_service.summarize_matches(description, context)
    except RuntimeError as e:
        summary = description  # fall back to raw description if second call fails

    db.add(models.AIQueryLog(
        officer_id=current_officer.id,
        query_type="smart_scan_image",
        query_text=f"[image: {file.filename}]\n{description}",
        response_text=summary,
    ))
    db.commit()

    return {
        "summary": f"AI description:\n{description}\n\n{summary}",
        "matched_missing_persons": persons,
        "matched_criminals": criminals,
        "matched_vehicles": vehicles,
    }
