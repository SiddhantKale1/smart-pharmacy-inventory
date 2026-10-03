from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from database import get_db
from models import SensorReading
from schemas import SensorReadingCreate, SensorReadingOut, ClimateStatusOut
from services.climate_service import record_sensor_reading, get_latest_climate_status

router = APIRouter(prefix="/api/sensor", tags=["Sensors & Climate"])

@router.post("")
async def ingest_sensor_reading(data: SensorReadingCreate, db: Session = Depends(get_db)):
    """
    ESP32 Hardware Ingestion Endpoint.
    Receives DHT22 temperature and humidity, evaluates climate bounds,
    generates climate alerts if breached, and forwards telemetry to ThingSpeak.
    """
    result = await record_sensor_reading(db, data.temperature, data.humidity)
    return {
        "success": True,
        "message": "Telemetry received and processed",
        "temperature": data.temperature,
        "humidity": data.humidity,
        "temperature_status": result["temperature_status"],
        "humidity_status": result["humidity_status"],
        "overall_status": result["overall_status"]
    }

@router.get("/latest", response_model=ClimateStatusOut)
def get_current_sensor_status(db: Session = Depends(get_db)):
    return get_latest_climate_status(db)

@router.get("/history", response_model=List[SensorReadingOut])
def get_sensor_history(
    limit: int = Query(50, ge=1, le=500),
    db: Session = Depends(get_db)
):
    readings = db.query(SensorReading).order_by(desc(SensorReading.created_at)).limit(limit).all()
    return readings
