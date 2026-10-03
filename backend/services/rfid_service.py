import datetime
import re
from sqlalchemy.orm import Session
from models import RFIDTag, Batch, Medicine, Transaction, Alert

# Global counter for RFID scan activity (can also feed ThingSpeak Field 4)
RFID_SCAN_COUNTER = 0
LAST_TAPPED_TAG = {
    "uid": None,
    "scanned_at": None,
    "is_assigned": False
}

def get_latest_tapped_tag():
    global LAST_TAPPED_TAG
    return LAST_TAPPED_TAG

def normalize_uid(uid: str) -> str:
    """Standardizes RFID UID to uppercase format XX:XX:XX:XX or plain uppercase"""
    cleaned = re.sub(r'[^A-Fa-f0-9]', '', uid).upper()
    if len(cleaned) == 8:
        return ":".join(cleaned[i:i+2] for i in range(0, 8, 2))
    elif len(cleaned) == 14:  # 7-byte UID
        return ":".join(cleaned[i:i+2] for i in range(0, 14, 2))
    return uid.strip().upper()

def process_rfid_scan(db: Session, raw_uid: str) -> dict:
    global RFID_SCAN_COUNTER, LAST_TAPPED_TAG
    RFID_SCAN_COUNTER += 1
    
    uid = normalize_uid(raw_uid)
    
    # Also check case-insensitive match
    tag = db.query(RFIDTag).filter(
        (RFIDTag.uid == uid) | (RFIDTag.uid == raw_uid.strip())
    ).first()
    
    LAST_TAPPED_TAG = {
        "uid": uid,
        "scanned_at": datetime.datetime.utcnow().isoformat(),
        "is_assigned": bool(tag and tag.status == "ASSIGNED")
    }
    
    if not tag or tag.status != "ASSIGNED":
        return {
            "success": False,
            "message": "Unknown RFID tag",
            "medicine": None,
            "batch": None,
            "remaining_quantity": None
        }
        
    batch = db.query(Batch).filter(Batch.id == tag.batch_id).first()
    if not batch:
        return {
            "success": False,
            "message": "Associated batch not found",
            "medicine": None,
            "batch": None,
            "remaining_quantity": None
        }
        
    medicine = db.query(Medicine).filter(Medicine.id == batch.medicine_id).first()
    if not medicine:
        return {
            "success": False,
            "message": "Associated medicine record not found",
            "medicine": None,
            "batch": None,
            "remaining_quantity": None
        }
        
    # Check expiry
    today = datetime.date.today()
    if batch.expiry_date < today:
        # Create critical alert for attempted sale of expired medicine
        alert = Alert(
            alert_type="EXPIRY",
            severity="CRITICAL",
            message=f"Attempted sale of EXPIRED medicine! {medicine.name} (Batch {batch.batch_number}) expired on {batch.expiry_date}.",
            medicine_id=medicine.id,
            batch_id=batch.id
        )
        db.add(alert)
        db.commit()
        return {
            "success": False,
            "message": "Medicine batch has expired. Sale blocked.",
            "medicine": medicine.name,
            "batch": batch.batch_number,
            "remaining_quantity": batch.quantity_remaining
        }
        
    # Check stock
    if batch.quantity_remaining <= 0:
        return {
            "success": False,
            "message": "Medicine out of stock",
            "medicine": medicine.name,
            "batch": batch.batch_number,
            "remaining_quantity": 0
        }
        
    # Deduct stock
    batch.quantity_remaining -= 1
    
    # Record transaction
    transaction = Transaction(
        rfid_uid=tag.uid,
        batch_id=batch.id,
        medicine_id=medicine.id,
        quantity=1,
        transaction_type="SALE",
        notes=f"RFID tap sale via RC522: 1 unit of {medicine.name} (Batch {batch.batch_number})"
    )
    db.add(transaction)
    
    # If now empty or low stock, create alert
    if batch.quantity_remaining <= medicine.reorder_level:
        existing = db.query(Alert).filter(
            Alert.batch_id == batch.id,
            Alert.alert_type == "STOCK",
            Alert.resolved == False
        ).first()
        if not existing:
            alert = Alert(
                alert_type="STOCK",
                severity="WARNING" if batch.quantity_remaining > 0 else "CRITICAL",
                message=f"{medicine.name} (Batch {batch.batch_number}) reached low stock ({batch.quantity_remaining} left).",
                medicine_id=medicine.id,
                batch_id=batch.id
            )
            db.add(alert)
            
    db.commit()
    db.refresh(transaction)
    
    return {
        "success": True,
        "message": "Sale recorded",
        "medicine": medicine.name,
        "batch": batch.batch_number,
        "remaining_quantity": batch.quantity_remaining,
        "transaction_id": transaction.id,
        "status": "COMPLETED"
    }

def assign_rfid_tag(db: Session, raw_uid: str, medicine_id: int, batch_id: int) -> dict:
    uid = normalize_uid(raw_uid)
    
    # Verify medicine and batch exist
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    batch = db.query(Batch).filter(Batch.id == batch_id).first()
    if not med or not batch:
        return {"success": False, "message": "Medicine or Batch not found"}
        
    # Prevent duplicate UID assignment
    existing = db.query(RFIDTag).filter(
        (RFIDTag.uid == uid) | (RFIDTag.uid == raw_uid.strip())
    ).first()
    
    if existing and existing.status == "ASSIGNED" and existing.batch_id != batch_id:
        return {
            "success": False,
            "message": f"Tag UID {uid} is already assigned to another batch. Please use another tag or dissociate it first."
        }
        
    if existing:
        existing.medicine_id = medicine_id
        existing.batch_id = batch_id
        existing.status = "ASSIGNED"
        existing.assigned_at = datetime.datetime.utcnow()
        tag = existing
    else:
        tag = RFIDTag(
            uid=uid,
            medicine_id=medicine_id,
            batch_id=batch_id,
            status="ASSIGNED",
            assigned_at=datetime.datetime.utcnow()
        )
        db.add(tag)
        
    # Create info alert
    info_alert = Alert(
        alert_type="RFID",
        severity="INFO",
        message=f"RFID tag {uid} assigned to {med.name} (Batch {batch.batch_number}).",
        medicine_id=medicine_id,
        batch_id=batch_id
    )
    db.add(info_alert)
    db.commit()
    db.refresh(tag)
    
    return {
        "success": True,
        "message": f"Tag {uid} successfully assigned to {med.name}",
        "tag": {
            "id": tag.id,
            "uid": tag.uid,
            "medicine": med.name,
            "batch": batch.batch_number,
            "status": tag.status
        }
    }
