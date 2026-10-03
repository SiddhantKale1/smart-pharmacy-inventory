from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from database import get_db
from models import Batch, Medicine, Transaction
from schemas import BatchCreate, BatchUpdate, BatchOut
from services.inventory_service import compute_batch_expiry_info, check_and_create_expiry_and_stock_alerts

router = APIRouter(prefix="/api/batches", tags=["Batches"])

@router.get("", response_model=List[BatchOut])
def get_batches(
    medicine_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Batch)
    if medicine_id:
        query = query.filter(Batch.medicine_id == medicine_id)
    batches = query.order_by(Batch.expiry_date.asc()).all()
    
    results = []
    for b in batches:
        days, st = compute_batch_expiry_info(b.expiry_date)
        med = db.query(Medicine).filter(Medicine.id == b.medicine_id).first()
        out = BatchOut.from_orm(b)
        out.medicine_name = med.name if med else "Unknown"
        out.days_until_expiry = days
        out.status = st
        results.append(out)
    return results

@router.post("", response_model=BatchOut)
def create_batch(data: BatchCreate, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == data.medicine_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
        
    batch = Batch(**data.dict())
    if not batch.received_date:
        batch.received_date = datetime.date.today()
    db.add(batch)
    db.commit()
    db.refresh(batch)
    
    # Record restock transaction
    tx = Transaction(
        batch_id=batch.id,
        medicine_id=med.id,
        quantity=batch.quantity_received,
        transaction_type="RESTOCK",
        notes=f"Initial stock receipt for Batch {batch.batch_number}"
    )
    db.add(tx)
    db.commit()
    
    # Refresh alerts
    check_and_create_expiry_and_stock_alerts(db)
    
    days, st = compute_batch_expiry_info(batch.expiry_date)
    out = BatchOut.from_orm(batch)
    out.medicine_name = med.name
    out.days_until_expiry = days
    out.status = st
    return out

@router.put("/{id}", response_model=BatchOut)
def update_batch(id: int, data: BatchUpdate, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(batch, key, value)
    db.commit()
    db.refresh(batch)
    
    check_and_create_expiry_and_stock_alerts(db)
    
    days, st = compute_batch_expiry_info(batch.expiry_date)
    med = db.query(Medicine).filter(Medicine.id == batch.medicine_id).first()
    out = BatchOut.from_orm(batch)
    out.medicine_name = med.name if med else "Unknown"
    out.days_until_expiry = days
    out.status = st
    return out

@router.delete("/{id}")
def delete_batch(id: int, db: Session = Depends(get_db)):
    batch = db.query(Batch).filter(Batch.id == id).first()
    if not batch:
        raise HTTPException(status_code=404, detail="Batch not found")
    db.delete(batch)
    db.commit()
    return {"message": f"Batch '{batch.batch_number}' deleted successfully"}
