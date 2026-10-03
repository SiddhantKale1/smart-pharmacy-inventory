import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from database import get_db
from models import Alert, Medicine, Batch
from schemas import AlertOut
from services.inventory_service import check_and_create_expiry_and_stock_alerts

router = APIRouter(prefix="/api/alerts", tags=["Alerts"])

@router.get("", response_model=List[AlertOut])
def get_alerts(
    category: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    resolved: Optional[bool] = Query(None),
    db: Session = Depends(get_db)
):
    # Ensure any new expiry or stock situations have alerts created
    check_and_create_expiry_and_stock_alerts(db)
    
    query = db.query(Alert)
    
    if category:
        query = query.filter(Alert.alert_type == category.upper())
    if severity:
        query = query.filter(Alert.severity == severity.upper())
    if resolved is not None:
        query = query.filter(Alert.resolved == resolved)
        
    alerts = query.order_by(Alert.resolved.asc(), desc(Alert.created_at)).all()
    
    results = []
    for a in alerts:
        out = AlertOut.from_orm(a)
        if a.medicine_id:
            med = db.query(Medicine).filter(Medicine.id == a.medicine_id).first()
            if med:
                out.medicine_name = med.name
        if a.batch_id:
            b = db.query(Batch).filter(Batch.id == a.batch_id).first()
            if b:
                out.batch_number = b.batch_number
        results.append(out)
    return results

@router.post("/{id}/resolve")
def resolve_alert(id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
        
    alert.resolved = True
    alert.resolved_at = datetime.datetime.utcnow()
    db.commit()
    return {"success": True, "message": f"Alert {id} marked as resolved"}

@router.post("/resolve-all")
def resolve_all_alerts(db: Session = Depends(get_db)):
    db.query(Alert).filter(Alert.resolved == False).update({
        "resolved": True,
        "resolved_at": datetime.datetime.utcnow()
    })
    db.commit()
    return {"success": True, "message": "All active alerts marked as resolved"}
