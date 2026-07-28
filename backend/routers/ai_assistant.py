from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from auth import get_current_officer
from ai import gemini_service

router = APIRouter(prefix="/api/ai", tags=["Sherlock AI"])


def _build_context(db: Session, message: str, limit: int = 5) -> str:
    """Very lightweight keyword-based retrieval: pulls a handful of the most
    recently updated records so Gemini has real data to ground its answer in.
    For a bigger dataset you'd swap this for proper full-text or vector search."""
    words = [w.strip(".,?!").lower() for w in message.split() if len(w) > 3]

    def matches(text: str) -> bool:
        text_l = (text or "").lower()
        return any(w in text_l for w in words)

    parts = []

    cases = db.query(models.Case).order_by(models.Case.updated_at.desc()).limit(50).all()
    hit_cases = [c for c in cases if matches(c.title) or matches(c.description)][:limit] or cases[:limit]
    if hit_cases:
        parts.append("CASES:\n" + "\n".join(
            f"- [{c.case_number}] {c.title} | status={c.status} | priority={c.priority} | {c.location}"
            for c in hit_cases
        ))

    persons = db.query(models.MissingPerson).order_by(models.MissingPerson.created_at.desc()).limit(50).all()
    hit_persons = [p for p in persons if matches(p.name) or matches(p.last_seen_location) or matches(p.description)][:limit]
    if hit_persons:
        parts.append("MISSING PERSONS:\n" + "\n".join(
            f"- {p.name}, age {p.age}, last seen {p.last_seen_location} on {p.last_seen_date}, status={p.status}"
            for p in hit_persons
        ))

    vehicles = db.query(models.Vehicle).order_by(models.Vehicle.reported_date.desc()).limit(50).all()
    hit_vehicles = [v for v in vehicles if matches(v.plate_number) or matches(v.make) or matches(v.model)][:limit]
    if hit_vehicles:
        parts.append("VEHICLES:\n" + "\n".join(
            f"- {v.plate_number} | {v.color} {v.make} {v.model} | status={v.status}"
            for v in hit_vehicles
        ))

    criminals = db.query(models.CriminalRecord).order_by(models.CriminalRecord.created_at.desc()).limit(50).all()
    hit_criminals = [c for c in criminals if matches(c.name) or matches(c.aliases) or matches(c.charges)][:limit]
    if hit_criminals:
        parts.append("CRIMINAL RECORDS:\n" + "\n".join(
            f"- {c.name} (aliases: {c.aliases}) | status={c.status} | risk={c.risk_level} | charges={c.charges}"
            for c in hit_criminals
        ))

    return "\n\n".join(parts)


@router.post("/chat", response_model=schemas.AIChatResponse)
def chat(
    req: schemas.AIChatRequest,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    context = _build_context(db, req.message)
    try:
        reply = gemini_service.chat_reply(req.message, context)
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))

    log = models.AIQueryLog(
        officer_id=current_officer.id,
        query_type="chat",
        query_text=req.message,
        response_text=reply,
    )
    db.add(log)
    db.commit()

    return {"reply": reply}
