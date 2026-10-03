import os
import time
import logging
import httpx
from typing import Optional, Dict

logger = logging.getLogger("smart_pharma.thingspeak")

THINGSPEAK_WRITE_API_KEY = os.getenv("THINGSPEAK_WRITE_API_KEY", "")
THINGSPEAK_CHANNEL_ID = os.getenv("THINGSPEAK_CHANNEL_ID", "")
THINGSPEAK_URL = "https://api.thingspeak.com/update"

LAST_UPDATE_TIME = 0
MIN_INTERVAL_SECONDS = 15  # ThingSpeak free tier requires 15s interval

# Status cache
thingspeak_state = {
    "last_sent": None,
    "last_status_code": None,
    "last_error": None,
    "total_payloads_sent": 0
}

def get_thingspeak_status() -> Dict:
    configured = bool(THINGSPEAK_WRITE_API_KEY and THINGSPEAK_WRITE_API_KEY != "DEMO_WRITE_API_KEY")
    return {
        "configured": configured,
        "channel_id": THINGSPEAK_CHANNEL_ID or "Demo Channel",
        "last_feed_time": thingspeak_state["last_sent"],
        "status": "ONLINE" if configured and not thingspeak_state["last_error"] else ("DEMO_MODE" if not configured else "ERROR"),
        "total_payloads_sent": thingspeak_state["total_payloads_sent"],
        "last_error": thingspeak_state["last_error"],
        "field_mappings": {
            "field1": "Temperature (°C)",
            "field2": "Humidity (%)",
            "field3": "Climate Status (1=NORMAL, 2=WARNING, 3=CRITICAL)",
            "field4": "RFID Scan Count"
        }
    }

async def send_to_thingspeak(temperature: float, humidity: float, status_code: int = 1, rfid_count: int = 0) -> bool:
    """
    Sends telemetry to ThingSpeak.
    Non-blocking / fails gracefully without raising exceptions to the caller.
    """
    global LAST_UPDATE_TIME
    
    now = time.time()
    if (now - LAST_UPDATE_TIME) < MIN_INTERVAL_SECONDS:
        # Rate limit throttling
        logger.debug("ThingSpeak update throttled (within 15s window)")
        return False
        
    api_key = os.getenv("THINGSPEAK_WRITE_API_KEY", "")
    if not api_key or api_key == "DEMO_WRITE_API_KEY":
        # Operating in local/demo mode
        thingspeak_state["last_sent"] = time.strftime("%Y-%m-%d %H:%M:%S")
        thingspeak_state["total_payloads_sent"] += 1
        thingspeak_state["last_error"] = None
        return True
        
    payload = {
        "api_key": api_key,
        "field1": round(temperature, 2),
        "field2": round(humidity, 2),
        "field3": status_code,
        "field4": rfid_count
    }
    
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            resp = await client.post(THINGSPEAK_URL, data=payload)
            if resp.status_code == 200 and resp.text != "0":
                LAST_UPDATE_TIME = now
                thingspeak_state["last_sent"] = time.strftime("%Y-%m-%d %H:%M:%S")
                thingspeak_state["last_status_code"] = resp.status_code
                thingspeak_state["last_error"] = None
                thingspeak_state["total_payloads_sent"] += 1
                logger.info(f"ThingSpeak telemetry published successfully: Entry #{resp.text}")
                return True
            else:
                thingspeak_state["last_error"] = f"ThingSpeak returned status {resp.status_code}: {resp.text}"
                return False
    except Exception as e:
        thingspeak_state["last_error"] = str(e)
        logger.warning(f"ThingSpeak push failed (graceful fallback): {e}")
        return False
