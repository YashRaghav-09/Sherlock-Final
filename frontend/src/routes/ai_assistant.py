from typing import List

@router.get("/history", response_model=List[schemas.AIHistoryEntry])
def get_history(
    limit: int = 200,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    """Returns this officer's past AI chat/voice queries, newest first."""
    logs = (
        db.query(models.AIQueryLog)
        .filter(models.AIQueryLog.officer_id == current_officer.id)
        .order_by(models.AIQueryLog.created_at.desc())
        .limit(limit)
        .all()
    )
    return logs


@router.delete("/history/{entry_id}")
def delete_history_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_officer: models.Officer = Depends(get_current_officer),
):
    entry = (
        db.query(models.AIQueryLog)
        .filter(
            models.AIQueryLog.id == entry_id,
            models.AIQueryLog.officer_id == current_officer.id,
        )
        .first()
    )
    if not entry:
        raise HTTPException(status_code=404, detail="History entry not found")
    db.delete(entry)
    db.commit()
    return {"deleted": True}