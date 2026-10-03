from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from database import get_db
from schemas import RFIDScanRequest, SensorReadingCreate
from services.rfid_service import process_rfid_scan
from services.climate_service import record_sensor_reading
from services.seed_data import seed_database
from models import Base
from database import engine

router = APIRouter(prefix="/api/simulate", tags=["Hardware Simulation"])

@router.post("/rfid-tap")
def simulate_rfid_tap(data: RFIDScanRequest, db: Session = Depends(get_db)):
    """Simulates an ESP32 RC522 RFID card tap for testing and demonstration"""
    return process_rfid_scan(db, data.uid)

@router.post("/sensor-push")
async def simulate_sensor_push(data: SensorReadingCreate, db: Session = Depends(get_db)):
    """Simulates an ESP32 DHT22 sensor reading push (e.g. testing critical climate alerts)"""
    return await record_sensor_reading(db, data.temperature, data.humidity)

@router.post("/reset-demo-data")
def reset_demo_data(db: Session = Depends(get_db)):
    """Reinitializes database with default demo medicines, batches, RFID tags, and invoices"""
    # Drop all and recreate
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    seed_database(db)
    return {"success": True, "message": "Demo data successfully reinitialized"}
