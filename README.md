# Smart Pharmacy Inventory & Expiry Monitoring System (IoT)

A full-stack, enterprise-grade Internet of Things (IoT) smart inventory, climate surveillance, and expiry monitoring system for pharmaceutical retail shops and dispensaries.

Built with a bold **Neobrutalism UI** design system.

---

## Architecture Overview

```
Physical Pharmacy Stock (Medicine + RC522 RFID Tag)
               │
               ▼
   ESP32 DevKit (RC522 + DHT22)
     ├── SPI: RC522 RFID Reader
     └── GPIO 27: DHT22 Climate Sensor
               │
        WiFi (HTTP REST)
               │
               ▼
     FastAPI Backend Gateway (Python 3.12)
        ├── Automatic Expiry Deduplication Service
        ├── Stock Deduction & Audit Logger
        ├── Climate Breach Detector
        ├── Scikit-Learn Demand Forecasting Engine
        └── IMAP Email / Invoice Ingestion
               │
               ▼
      PostgreSQL / SQLite Storage
               │
               ▼
      React 18 + Vite Frontend (Neobrutalism UI)
        ├── Real-time Inventory Status Matrix
        ├── Climate Telemetry Gauges (Temp & Humidity)
        ├── Live RC522 Hardware RFID Registration
        ├── Label Printing Layout
        ├── Sales Point-of-Sale (POS) Terminal
        └── Demand Forecasting Visualizations
```

---

## Key Features

1. **Physical RFID Tap & Deduction**:
   - Tapping an RFID tag on the RC522 reads the chip UID.
   - Evaluates expiry bounds: automatically **blocks expired medicine** sales and flags critical alerts.
   - Decrements stock in real time and registers an audited `SALE` transaction.

2. **Real-Time Climate Monitoring (DHT22)**:
   - Evaluates ambient storage temperature and relative humidity against clinical safe thresholds (15°C–30°C, 30%–70% RH).
   - Generates instant critical climate alerts on threshold breach.
   - Telemetry synced to local database and ThingSpeak IoT channel.

3. **Live Hardware Tag Pairing**:
   - Instant RC522 hardware detection: tapping any card on the reader automatically detects and displays the UID on the registration screen for 1-click batch pairing.

4. **Neobrutalism Design System**:
   - High-contrast, vibrant palette (Yellow, Lime, Orange, Coral) with zero blues or purples.
   - Bold 2–4px solid black borders, hard offset drop shadows (`shadow-[4px_4px_0px_#000]`), and crisp typography.

5. **Expiry & Stock Protection**:
   - 3-tier expiry status: **SAFE**, **EXPIRING SOON** (≤ 30 days), and **EXPIRED**.
   - Automated deduplication prevents repeated spam alerts.

6. **Demand Prediction Engine**:
   - Scikit-Learn regression model predicting 30-day demand and recommended reorder quantities based on historical transaction velocity.

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Recharts
- **Backend**: FastAPI, SQLAlchemy, Pydantic v2, Uvicorn, Python-dotenv
- **Database**: PostgreSQL / SQLite fallback
- **Hardware**: ESP32 DevKit, MFRC522 RFID Reader (SPI), DHT22 Climate Sensor (GPIO 27)
- **External IoT**: ThingSpeak Telemetry API

---

## Hardware Pinout

| Module | Pin | ESP32 GPIO | Description |
|---|---|---|---|
| **RC522** | SDA / SS | GPIO 5 | SPI Chip Select |
| **RC522** | SCK | GPIO 18 | SPI Clock |
| **RC522** | MOSI | GPIO 23 | SPI MOSI |
| **RC522** | MISO | GPIO 19 | SPI MISO |
| **RC522** | RST | GPIO 22 | Reset Line |
| **RC522** | VCC | 3.3V | **Do NOT connect to 5V!** |
| **RC522** | GND | GND | Ground |
| **DHT22** | + (VCC) | 3.3V | Power |
| **DHT22** | OUT (Data)| GPIO 27 | Data (Internal pull-up enabled) |
| **DHT22** | - (GND) | GND | Ground |

---

## Quickstart

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. ESP32 Firmware
1. Open `esp32/smart_pharmacy.ino` in Arduino IDE.
2. Update `WIFI_SSID`, `WIFI_PASSWORD`, and `SERVER_BASE_URL` with your local network settings.
3. Install libraries: `MFRC522`, `DHT sensor library`, `Adafruit Unified Sensor`, `ArduinoJson`.
4. Upload to ESP32 DevKit at 115200 baud.
