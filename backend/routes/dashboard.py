from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
import datetime
from database import get_db
from models import Medicine, Batch, RFIDTag, Transaction, Alert, SensorReading, Invoice
from services.climate_service import get_latest_climate_status
from services.thingspeak_service import get_thingspeak_status

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

@router.get("")
def get_dashboard_data(db: Session = Depends(get_db)):
    today = datetime.date.today()
    in_30_days = today + datetime.timedelta(days=30)
    
    # 1. Total Medicines
    total_medicines = db.query(Medicine).count()
    
    # 2. Total Batches
    total_batches = db.query(Batch).count()
    
    # 3. Total Inventory Units
    total_inventory_units = db.query(func.coalesce(func.sum(Batch.quantity_remaining), 0)).scalar()
    
    # 4. Low Stock Batches
    # Batch where quantity_remaining <= medicine.reorder_level
    low_stock_count = db.query(Batch).join(Medicine).filter(
        Batch.quantity_remaining <= Medicine.reorder_level,
        Batch.quantity_remaining > 0
    ).count()
    
    # 5. Expiring within 30 days (and not already expired)
    expiring_soon_count = db.query(Batch).filter(
        Batch.expiry_date >= today,
        Batch.expiry_date <= in_30_days,
        Batch.quantity_remaining > 0
    ).count()
    
    # 6. Expired Medicines
    expired_count = db.query(Batch).filter(
        Batch.expiry_date < today,
        Batch.quantity_remaining > 0
    ).count()
    
    # 7. Active Alerts
    active_alerts_count = db.query(Alert).filter(Alert.resolved == False).count()
    
    # 8. Climate telemetry
    climate = get_latest_climate_status(db)
    
    # 9. Recent sensor readings (last 20 readings for line charts)
    recent_readings = db.query(SensorReading).order_by(desc(SensorReading.created_at)).limit(20).all()
    readings_chart = [
        {
            "id": r.id,
            "timestamp": r.created_at.strftime("%H:%M:%S"),
            "temperature": round(r.temperature, 1),
            "humidity": round(r.humidity, 1)
        }
        for r in reversed(recent_readings)
    ]
    
    # 10. Recent Transactions
    recent_txs = db.query(Transaction).order_by(desc(Transaction.created_at)).limit(8).all()
    transactions_list = []
    for tx in recent_txs:
        med = db.query(Medicine).filter(Medicine.id == tx.medicine_id).first() if tx.medicine_id else None
        transactions_list.append({
            "id": tx.id,
            "rfid_uid": tx.rfid_uid,
            "medicine_name": med.name if med else "Medicine",
            "quantity": tx.quantity,
            "transaction_type": tx.transaction_type,
            "created_at": tx.created_at.strftime("%Y-%m-%d %H:%M:%S"),
            "notes": tx.notes
        })
        
    # 11. Recent Active Alerts
    recent_alerts = db.query(Alert).filter(Alert.resolved == False).order_by(desc(Alert.created_at)).limit(5).all()
    alerts_list = [
        {
            "id": a.id,
            "alert_type": a.alert_type,
            "severity": a.severity,
            "message": a.message,
            "created_at": a.created_at.strftime("%Y-%m-%d %H:%M:%S")
        }
        for a in recent_alerts
    ]
    
    # 12. Recent Invoices
    recent_invoices = db.query(Invoice).order_by(desc(Invoice.created_at)).limit(5).all()
    invoices_list = [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "supplier_name": inv.supplier.name if inv.supplier else "Supplier",
            "import_status": inv.import_status,
            "invoice_date": str(inv.invoice_date)
        }
        for inv in recent_invoices
    ]
    
    # 13. ThingSpeak Status
    ts_status = get_thingspeak_status()
    
    return {
        "kpis": {
            "total_medicines": total_medicines,
            "total_batches": total_batches,
            "total_inventory_units": int(total_inventory_units),
            "low_stock_count": low_stock_count,
            "expiring_soon_count": expiring_soon_count,
            "expired_count": expired_count,
            "active_alerts_count": active_alerts_count,
            "current_temperature": climate["current_temperature"],
            "current_humidity": climate["current_humidity"],
            "temperature_status": climate["temperature_status"],
            "humidity_status": climate["humidity_status"],
            "overall_climate_status": climate["overall_status"]
        },
        "sensor_chart": readings_chart,
        "recent_transactions": transactions_list,
        "recent_alerts": alerts_list,
        "recent_invoices": invoices_list,
        "thingspeak": ts_status
    }
