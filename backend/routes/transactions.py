import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from database import get_db
from models import Transaction, Medicine, Batch
from schemas import TransactionOut, TransactionCreate
from services.inventory_service import check_and_create_expiry_and_stock_alerts

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionOut])
def get_transactions(
    tx_type: Optional[str] = Query(None),
    medicine_id: Optional[int] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    query = db.query(Transaction)
    if tx_type:
        query = query.filter(Transaction.transaction_type == tx_type.upper())
    if medicine_id:
        query = query.filter(Transaction.medicine_id == medicine_id)
        
    txs = query.order_by(desc(Transaction.created_at)).limit(limit).all()
    results = []
    for tx in txs:
        out = TransactionOut.from_orm(tx)
        if tx.medicine_id:
            m = db.query(Medicine).filter(Medicine.id == tx.medicine_id).first()
            if m:
                out.medicine_name = m.name
        if tx.batch_id:
            b = db.query(Batch).filter(Batch.id == tx.batch_id).first()
            if b:
                out.batch_number = b.batch_number
        results.append(out)
    return results

@router.post("", response_model=TransactionOut)
def create_manual_transaction(data: TransactionCreate, db: Session = Depends(get_db)):
    batch = None
    if data.batch_id:
        batch = db.query(Batch).filter(Batch.id == data.batch_id).first()
        if not batch:
            raise HTTPException(status_code=404, detail="Batch not found")
            
    med_id = data.medicine_id or (batch.medicine_id if batch else None)
    
    # Inventory adjustment logic
    if batch:
        if data.transaction_type == "SALE":
            if batch.quantity_remaining < data.quantity:
                raise HTTPException(status_code=400, detail="Insufficient stock for sale")
            batch.quantity_remaining -= data.quantity
        elif data.transaction_type == "RESTOCK":
            batch.quantity_received += data.quantity
            batch.quantity_remaining += data.quantity
        elif data.transaction_type == "ADJUSTMENT":
            batch.quantity_remaining = max(0, batch.quantity_remaining + data.quantity)
        elif data.transaction_type == "RETURN":
            batch.quantity_remaining += data.quantity
            
    tx = Transaction(
        rfid_uid=data.rfid_uid,
        batch_id=data.batch_id,
        medicine_id=med_id,
        quantity=data.quantity,
        transaction_type=data.transaction_type.upper(),
        notes=data.notes or "Manual transaction record"
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)
    
    check_and_create_expiry_and_stock_alerts(db)
    
    out = TransactionOut.from_orm(tx)
    if med_id:
        m = db.query(Medicine).filter(Medicine.id == med_id).first()
        if m:
            out.medicine_name = m.name
    if batch:
        out.batch_number = batch.batch_number
    return out
