import datetime
from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import RFIDTag, Medicine, Batch
from schemas import RFIDTagOut, RFIDTagAssign, RFIDScanRequest, RFIDScanResponse
from services.rfid_service import process_rfid_scan, assign_rfid_tag, normalize_uid, get_latest_tapped_tag

router = APIRouter(prefix="/api/rfid", tags=["RFID"])

@router.get("/latest-tap")
def get_latest_tap():
    """Returns the most recent RFID UID tapped on the ESP32 RC522 hardware"""
    return get_latest_tapped_tag()

@router.get("", response_model=List[RFIDTagOut])
def get_rfid_tags(db: Session = Depends(get_db)):
    tags = db.query(RFIDTag).order_by(RFIDTag.id.desc()).all()
    results = []
    for t in tags:
        out = RFIDTagOut.from_orm(t)
        if t.medicine_id:
            med = db.query(Medicine).filter(Medicine.id == t.medicine_id).first()
            if med:
                out.medicine_name = med.name
        if t.batch_id:
            b = db.query(Batch).filter(Batch.id == t.batch_id).first()
            if b:
                out.batch_number = b.batch_number
                out.expiry_date = b.expiry_date
        results.append(out)
    return results

@router.get("/{uid}", response_model=RFIDTagOut)
def get_rfid_tag_by_uid(uid: str, db: Session = Depends(get_db)):
    norm_uid = normalize_uid(uid)
    tag = db.query(RFIDTag).filter(
        (RFIDTag.uid == norm_uid) | (RFIDTag.uid == uid.strip())
    ).first()
    if not tag:
        raise HTTPException(status_code=404, detail="RFID tag not found")
        
    out = RFIDTagOut.from_orm(tag)
    if tag.medicine_id:
        med = db.query(Medicine).filter(Medicine.id == tag.medicine_id).first()
        if med:
            out.medicine_name = med.name
    if tag.batch_id:
        b = db.query(Batch).filter(Batch.id == tag.batch_id).first()
        if b:
            out.batch_number = b.batch_number
            out.expiry_date = b.expiry_date
    return out

@router.post("/register")
def register_or_assign_tag(data: RFIDTagAssign, db: Session = Depends(get_db)):
    """Assigns an RFID tag to a specific medicine batch"""
    res = assign_rfid_tag(db, data.uid, data.medicine_id, data.batch_id)
    if not res["success"]:
        raise HTTPException(status_code=400, detail=res["message"])
    return res

@router.post("/scan", response_model=RFIDScanResponse)
def scan_rfid_tag(data: RFIDScanRequest, db: Session = Depends(get_db)):
    """
    ESP32 Hardware Scan Gateway & POS Scan API.
    Handles tap, stock decrement, sale transaction, and response payload.
    """
    res = process_rfid_scan(db, data.uid)
    return res

@router.post("/print-label/{tag_id}")
def mark_tag_printed(tag_id: int, db: Session = Depends(get_db)):
    tag = db.query(RFIDTag).filter(RFIDTag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="RFID tag not found")
    tag.printed_at = datetime.datetime.utcnow()
    db.commit()
    
    med = db.query(Medicine).filter(Medicine.id == tag.medicine_id).first() if tag.medicine_id else None
    batch = db.query(Batch).filter(Batch.id == tag.batch_id).first() if tag.batch_id else None
    
    return {
        "success": True,
        "message": "Label marked as printed",
        "tag_uid": tag.uid,
        "medicine_name": med.name if med else "N/A",
        "batch_number": batch.batch_number if batch else "N/A",
        "expiry_date": str(batch.expiry_date) if batch else "N/A",
        "printed_at": tag.printed_at.strftime("%Y-%m-%d %H:%M:%S")
    }
