from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import ThingSpeakStatus
from services.thingspeak_service import get_thingspeak_status, send_to_thingspeak
from services.climate_service import get_latest_climate_status
from services.rfid_service import RFID_SCAN_COUNTER

router = APIRouter(prefix="/api/thingspeak", tags=["ThingSpeak"])

@router.get("/status", response_model=ThingSpeakStatus)
def check_thingspeak_status():
    return get_thingspeak_status()

@router.post("/sync-now")
async def force_thingspeak_sync(db: Session = Depends(get_db)):
    climate = get_latest_climate_status(db)
    temp = climate.get("current_temperature") or 22.0
    hum = climate.get("current_humidity") or 45.0
    status_code = 3 if climate.get("overall_status") == "CRITICAL" else (2 if climate.get("overall_status") == "WARNING" else 1)
    
    success = await send_to_thingspeak(
        temperature=temp,
        humidity=hum,
        status_code=status_code,
        rfid_count=RFID_SCAN_COUNTER
    )
    return {
        "success": success,
        "temperature": temp,
        "humidity": hum,
        "status_code": status_code,
        "rfid_count": RFID_SCAN_COUNTER,
        "status": get_thingspeak_status()
    }
