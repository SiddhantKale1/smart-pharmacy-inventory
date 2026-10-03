import datetime
from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import SensorReading, Medicine, Alert
from services.thingspeak_service import send_to_thingspeak
from services.rfid_service import RFID_SCAN_COUNTER

def evaluate_climate(db: Session, temperature: float, humidity: float):
    """
    Evaluates temperature and humidity against stored medicine requirements.
    Determines status (NORMAL, WARNING, CRITICAL) and creates alerts if thresholds are breached.
    """
    medicines = db.query(Medicine).all()
    temp_status = "NORMAL"
    humidity_status = "NORMAL"
    status_code = 1  # 1=NORMAL, 2=WARNING, 3=CRITICAL
    
    violated_medicines = []
    
    for med in medicines:
        temp_breach = False
        humidity_breach = False
        
        # Temperature check
        if temperature > med.max_temperature:
            temp_breach = True
            diff = temperature - med.max_temperature
            severity = "CRITICAL" if diff > 5.0 else "WARNING"
            if severity == "CRITICAL":
                temp_status = "CRITICAL"
                status_code = max(status_code, 3)
            elif temp_status != "CRITICAL":
                temp_status = "WARNING"
                status_code = max(status_code, 2)
                
            # Create alert with 1-hour deduplication
            recent_alert = db.query(Alert).filter(
                Alert.alert_type == "TEMPERATURE",
                Alert.medicine_id == med.id,
                Alert.resolved == False
            ).first()
            if not recent_alert:
                msg = f"Storage temperature is too high for {med.name}. Current: {temperature:.1f}°C (Allowed max: {med.max_temperature:.1f}°C)."
                alert = Alert(
                    alert_type="TEMPERATURE",
                    severity=severity,
                    message=msg,
                    medicine_id=med.id
                )
                db.add(alert)
                
        elif temperature < med.min_temperature:
            temp_breach = True
            diff = med.min_temperature - temperature
            severity = "CRITICAL" if diff > 4.0 else "WARNING"
            if severity == "CRITICAL":
                temp_status = "CRITICAL"
                status_code = max(status_code, 3)
            elif temp_status != "CRITICAL":
                temp_status = "WARNING"
                status_code = max(status_code, 2)
                
            recent_alert = db.query(Alert).filter(
                Alert.alert_type == "TEMPERATURE",
                Alert.medicine_id == med.id,
                Alert.resolved == False
            ).first()
            if not recent_alert:
                msg = f"Storage temperature is too low for {med.name}. Current: {temperature:.1f}°C (Allowed min: {med.min_temperature:.1f}°C)."
                alert = Alert(
                    alert_type="TEMPERATURE",
                    severity=severity,
                    message=msg,
                    medicine_id=med.id
                )
                db.add(alert)

        # Humidity check
        if humidity > med.max_humidity:
            humidity_breach = True
            severity = "CRITICAL" if (humidity - med.max_humidity) > 15.0 else "WARNING"
            if severity == "CRITICAL":
                humidity_status = "CRITICAL"
                status_code = max(status_code, 3)
            elif humidity_status != "CRITICAL":
                humidity_status = "WARNING"
                status_code = max(status_code, 2)
                
            recent_alert = db.query(Alert).filter(
                Alert.alert_type == "HUMIDITY",
                Alert.medicine_id == med.id,
                Alert.resolved == False
            ).first()
            if not recent_alert:
                msg = f"Storage humidity is too high for {med.name}. Current: {humidity:.1f}% (Allowed max: {med.max_humidity:.1f}%)."
                alert = Alert(
                    alert_type="HUMIDITY",
                    severity=severity,
                    message=msg,
                    medicine_id=med.id
                )
                db.add(alert)
        elif humidity < med.min_humidity:
            humidity_breach = True
            severity = "WARNING"
            if humidity_status != "CRITICAL":
                humidity_status = "WARNING"
                status_code = max(status_code, 2)
                
            recent_alert = db.query(Alert).filter(
                Alert.alert_type == "HUMIDITY",
                Alert.medicine_id == med.id,
                Alert.resolved == False
            ).first()
            if not recent_alert:
                msg = f"Storage humidity is too low for {med.name}. Current: {humidity:.1f}% (Allowed min: {med.min_humidity:.1f}%)."
                alert = Alert(
                    alert_type="HUMIDITY",
                    severity=severity,
                    message=msg,
                    medicine_id=med.id
                )
                db.add(alert)
                
    db.commit()
    
    overall = "CRITICAL" if (temp_status == "CRITICAL" or humidity_status == "CRITICAL") else (
        "WARNING" if (temp_status == "WARNING" or humidity_status == "WARNING") else "NORMAL"
    )
    
    return temp_status, humidity_status, overall, status_code

async def record_sensor_reading(db: Session, temperature: float, humidity: float):
    # Store reading in database
    reading = SensorReading(
        temperature=temperature,
        humidity=humidity,
        created_at=datetime.datetime.utcnow()
    )
    db.add(reading)
    db.commit()
    db.refresh(reading)
    
    # Evaluate against medicine requirements
    temp_st, hum_st, overall_st, status_code = evaluate_climate(db, temperature, humidity)
    
    # Forward to ThingSpeak asynchronously
    await send_to_thingspeak(
        temperature=temperature,
        humidity=humidity,
        status_code=status_code,
        rfid_count=RFID_SCAN_COUNTER
    )
    
    return {
        "reading": reading,
        "temperature_status": temp_st,
        "humidity_status": hum_st,
        "overall_status": overall_st
    }

def get_latest_climate_status(db: Session):
    latest = db.query(SensorReading).order_by(desc(SensorReading.created_at)).first()
    if not latest:
        return {
            "current_temperature": 22.5,
            "current_humidity": 45.0,
            "temperature_status": "NORMAL",
            "humidity_status": "NORMAL",
            "overall_status": "NORMAL",
            "active_climate_alerts": 0,
            "last_updated": datetime.datetime.utcnow()
        }
        
    temp_st, hum_st, overall_st, _ = evaluate_climate(db, latest.temperature, latest.humidity)
    active_alerts = db.query(Alert).filter(
        Alert.alert_type.in_(["TEMPERATURE", "HUMIDITY"]),
        Alert.resolved == False
    ).count()
    
    return {
        "current_temperature": latest.temperature,
        "current_humidity": latest.humidity,
        "temperature_status": temp_st,
        "humidity_status": hum_st,
        "overall_status": overall_st,
        "active_climate_alerts": active_alerts,
        "last_updated": latest.created_at
    }
