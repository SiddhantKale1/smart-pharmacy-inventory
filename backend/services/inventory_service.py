import datetime
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Medicine, Batch, RFIDTag, Transaction, Alert
from schemas import InventoryItemOut

def compute_batch_expiry_info(expiry_date: datetime.date):
    today = datetime.date.today()
    days_until = (expiry_date - today).days
    if days_until < 0:
        return days_until, "EXPIRED"
    elif days_until <= 30:
        return days_until, "EXPIRING SOON"
    else:
        return days_until, "SAFE"

def determine_inventory_status(quantity_remaining: int, reorder_level: int, expiry_status: str):
    if expiry_status == "EXPIRED":
        return "EXPIRED"
    if quantity_remaining == 0:
        return "OUT OF STOCK"
    if expiry_status == "EXPIRING SOON":
        return "EXPIRING SOON"
    if quantity_remaining <= reorder_level:
        return "LOW STOCK"
    return "IN STOCK"

def get_full_inventory(db: Session):
    batches = db.query(Batch).join(Medicine).all()
    inventory_items = []
    
    for batch in batches:
        med = batch.medicine
        days_until, expiry_status = compute_batch_expiry_info(batch.expiry_date)
        inv_status = determine_inventory_status(batch.quantity_remaining, med.reorder_level, expiry_status)
        
        # Check if an RFID tag is assigned
        rfid = db.query(RFIDTag).filter(RFIDTag.batch_id == batch.id, RFIDTag.status == "ASSIGNED").first()
        
        item = InventoryItemOut(
            batch_id=batch.id,
            medicine_id=med.id,
            medicine_name=med.name,
            generic_name=med.generic_name,
            manufacturer=med.manufacturer,
            batch_number=batch.batch_number,
            expiry_date=batch.expiry_date,
            days_until_expiry=days_until,
            quantity_received=batch.quantity_received,
            quantity_remaining=batch.quantity_remaining,
            reorder_level=med.reorder_level,
            rfid_assigned=rfid is not None,
            rfid_uid=rfid.uid if rfid else None,
            rfid_status=rfid.status if rfid else "AVAILABLE",
            min_temperature=med.min_temperature,
            max_temperature=med.max_temperature,
            min_humidity=med.min_humidity,
            max_humidity=med.max_humidity,
            inventory_status=inv_status
        )
        inventory_items.append(item)
    return inventory_items

def check_and_create_expiry_and_stock_alerts(db: Session):
    """
    Checks all batches for expiry (<= 30 days or expired) and low stock.
    Deduplicates to prevent generating multiple unresolved alerts for the same condition.
    """
    today = datetime.date.today()
    batches = db.query(Batch).join(Medicine).all()
    
    for batch in batches:
        med = batch.medicine
        days_left = (batch.expiry_date - today).days
        
        # 1. Expiry Check
        if days_left < 0:
            # Expired
            existing_alert = db.query(Alert).filter(
                Alert.batch_id == batch.id,
                Alert.alert_type == "EXPIRY",
                Alert.resolved == False,
                Alert.severity == "CRITICAL"
            ).first()
            if not existing_alert:
                alert = Alert(
                    alert_type="EXPIRY",
                    severity="CRITICAL",
                    message=f"{med.name} batch {batch.batch_number} has EXPIRED ({abs(days_left)} days ago on {batch.expiry_date}). Quarantine stock immediately.",
                    medicine_id=med.id,
                    batch_id=batch.id
                )
                db.add(alert)
        elif days_left <= 30:
            # Expiring soon
            existing_alert = db.query(Alert).filter(
                Alert.batch_id == batch.id,
                Alert.alert_type == "EXPIRY",
                Alert.resolved == False
            ).first()
            if not existing_alert:
                alert = Alert(
                    alert_type="EXPIRY",
                    severity="WARNING",
                    message=f"{med.name} batch {batch.batch_number} expires in {days_left} days ({batch.expiry_date}).",
                    medicine_id=med.id,
                    batch_id=batch.id
                )
                db.add(alert)
                
        # 2. Low Stock Check
        if batch.quantity_remaining <= med.reorder_level and batch.quantity_remaining > 0:
            existing_stock_alert = db.query(Alert).filter(
                Alert.batch_id == batch.id,
                Alert.alert_type == "STOCK",
                Alert.resolved == False
            ).first()
            if not existing_stock_alert:
                alert = Alert(
                    alert_type="STOCK",
                    severity="WARNING",
                    message=f"{med.name} (Batch {batch.batch_number}) quantity is low ({batch.quantity_remaining} left, reorder level is {med.reorder_level}).",
                    medicine_id=med.id,
                    batch_id=batch.id
                )
                db.add(alert)
        elif batch.quantity_remaining == 0:
            existing_stock_alert = db.query(Alert).filter(
                Alert.batch_id == batch.id,
                Alert.alert_type == "STOCK",
                Alert.resolved == False,
                Alert.severity == "CRITICAL"
            ).first()
            if not existing_stock_alert:
                alert = Alert(
                    alert_type="STOCK",
                    severity="CRITICAL",
                    message=f"{med.name} (Batch {batch.batch_number}) is OUT OF STOCK.",
                    medicine_id=med.id,
                    batch_id=batch.id
                )
                db.add(alert)

    db.commit()
