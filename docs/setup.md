# Smart Pharmacy IoT System: Complete Setup, Deployment & Testing Guide

This guide provides end-to-end instructions for deploying, configuring, and demonstrating the **Smart Pharmacy IoT System** for a college project evaluation or production retail environment.

---

## 1. Prerequisites

Ensure your system has the following runtimes installed:
- **Python**: Version 3.10 or newer (tested on 3.10 - 3.14)
- **Node.js & npm**: Node v18+ (tested on v22)
- **PostgreSQL**: PostgreSQL 14+ (or SQLite local fallback)
- **Arduino IDE**: 2.x+ (for flashing ESP32 DevKit)

---

## 2. Directory Structure

```text
smart pharma inventory/
├── backend/                  # FastAPI REST Backend
│   ├── main.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── init_db.py
│   ├── setup_postgres.sql
│   ├── requirements.txt
│   ├── .env.example
│   ├── routes/
│   └── services/
├── frontend/                 # React 18 + Vite Web Application
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── esp32/                    # Arduino Firmware
│   └── smart_pharmacy.ino
├── ml/                       # Scikit-learn demand forecasting
│   └── demand_prediction.py
├── data/                     # Sample clinical dataset
│   └── sample_medicines.csv
├── docs/                     # Technical documentation
│   ├── architecture.md
│   ├── api.md
│   └── setup.md
└── run_system.sh             # Unified startup launcher
```

---

## 3. Database Setup (PostgreSQL)

### Option A: Using PostgreSQL (Recommended Production Mode)
1. Start the PostgreSQL daemon on your machine:
   ```bash
   sudo systemctl start postgresql
   ```
2. Log into PostgreSQL as the postgres user and create the database and user:
   ```bash
   sudo -u postgres psql
   ```
   Execute the following SQL commands:
   ```sql
   CREATE DATABASE pharma_inventory;
   CREATE USER pharma_user WITH ENCRYPTED PASSWORD 'pharma_password';
   GRANT ALL PRIVILEGES ON DATABASE pharma_inventory TO pharma_user;
   \c pharma_inventory
   GRANT ALL ON SCHEMA public TO pharma_user;
   \q
   ```
3. Update `backend/.env`:
   ```ini
   DATABASE_URL=postgresql://pharma_user:pharma_password@localhost:5432/pharma_inventory
   ```
4. Run the database migration script:
   ```bash
   cd "/home/sidd/Downloads/smart pharma inventory/backend"
   ./venv/bin/python3 init_db.py
   ```

### Option B: Zero-Setup SQLite Fallback
If PostgreSQL is not running or you want instant local demonstration without starting a database daemon:
In `backend/.env`:
```ini
DATABASE_URL=sqlite:///./pharma.db
```
The system will automatically initialize and auto-seed `pharma.db` with clinical demo data!

---

## 4. Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd "/home/sidd/Downloads/smart pharma inventory/backend"
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install required Python packages:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Configure your `.env` file (copied from `.env.example`):
   ```bash
   cp .env.example .env
   ```
5. Test and initialize the database:
   ```bash
   python3 init_db.py
   ```
6. Start the FastAPI backend server:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```
   Verify by opening: `http://localhost:8000/docs`

---

## 5. Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd "/home/sidd/Downloads/smart pharma inventory/frontend"
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web interface at: `http://localhost:5173`

---

## 6. ESP32 Microcontroller Setup & Flashing

### Hardware Wiring
Connect your ESP32 DevKit to the RC522 RFID reader and DHT22 sensor:
- **RC522 VCC** -> **3.3V** (Never use 5V)
- **RC522 GND** -> **GND**
- **RC522 RST** -> **GPIO 22**
- **RC522 SDA (SS)** -> **GPIO 5**
- **RC522 MOSI** -> **GPIO 23**
- **RC522 MISO** -> **GPIO 19**
- **RC522 SCK** -> **GPIO 18**
- **DHT22 + (VCC)** -> **3.3V**
- **DHT22 OUT** -> **GPIO 27**
- **DHT22 - (GND)** -> **GND**

### Required Arduino IDE Libraries
Open Arduino IDE -> **Tools** -> **Manage Libraries...** and install:
1. `MFRC522` by GithubCommunity (v1.4.10+)
2. `DHT sensor library` by Adafruit (v1.4.6+)
3. `Adafruit Unified Sensor` by Adafruit (v1.1.14+)
4. `ArduinoJson` by Benoit Blanchon (v6.21.4+)

### Flashing Procedure
1. Open `esp32/smart_pharmacy.ino` in Arduino IDE.
2. Select Board: **ESP32 Dev Module** (or your specific DevKit variant).
3. Update the following lines in `esp32/smart_pharmacy.ino`:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_SSID";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   const char* SERVER_BASE_URL = "http://YOUR_COMPUTER_LAN_IP:8000";
   ```
4. Click **Upload**.
5. Open the **Serial Monitor** at **115200 baud**.
   You will see:
   ```text
   ================================
   SMART PHARMACY IoT SYSTEM
   ================================
   WiFi connected
   IP: 192.168.1.x
   Temperature: 23.4 C
   Humidity: 48.5 %
   RFID READY
   ```

---

## 7. ThingSpeak IoT Integration

1. Go to [https://thingspeak.com](https://thingspeak.com) and create a free account.
2. Create a **New Channel** named `Smart Pharmacy Cold Chain`.
3. Configure the 4 fields:
   - **Field 1**: Temperature
   - **Field 2**: Humidity
   - **Field 3**: Storage Status
   - **Field 4**: RFID Scan Count
4. Copy your **Channel ID** and **Write API Key**.
5. Put them in `backend/.env`:
   ```ini
   THINGSPEAK_CHANNEL_ID=1234567
   THINGSPEAK_WRITE_API_KEY=YOUR_WRITE_KEY_HERE
   ```
6. The backend will automatically push sensor telemetry every 15+ seconds respecting ThingSpeak free tier rate limits.

---

## 8. Supplier Email (IMAP) Ingestion

1. If connecting a live Gmail account:
   - Enable 2-Factor Authentication in your Google Account.
   - Generate an **App Password** (Google Account -> Security -> 2-Step Verification -> App passwords).
   - In `backend/.env`:
     ```ini
     EMAIL_HOST=imap.gmail.com
     EMAIL_PORT=993
     EMAIL_USERNAME=your_pharmacy_email@gmail.com
     EMAIL_PASSWORD=your_16_char_app_password
     EMAIL_FOLDER=INBOX
     ```
2. If demo credentials remain in `.env`, the system seamlessly utilizes high-fidelity simulated supplier emails (from MedSupply Global and BioHealth Distributors) to demonstrate full invoice parsing and staging!

---

## 9. One-Click Unified Launch (`run_system.sh`)

To launch both the FastAPI backend and React frontend simultaneously with a single command:
```bash
cd "/home/sidd/Downloads/smart pharma inventory"
chmod +x run_system.sh
./run_system.sh
```

---

## 10. Complete Test & Evaluation Procedure

### Test 1: Real-time Dashboard & Climate Telemetry
1. Open `http://localhost:5173/dashboard`.
2. Observe Total Medicines (5), Total Batches (5), Inventory Units (144), Low Stock, and Expiring within 30 days.
3. Open the **IoT Simulator** (top right button).
4. Slide the temperature to `34.5°C` and click **Push Sensor Readings**.
5. Observe the live dashboard gauge turn `CRITICAL`, and navigate to `/alerts` to see the new temperature threshold breach alert!

### Test 2: RFID Sales Checkout & Stock Deduction
1. Go to `/sales`.
2. Click **Tap Paracetamol (43:A7:2C:19)** (or tap the card on your physical RC522).
3. Notice:
   - Green confirmation banner: "SALE RECORDED".
   - Medicine: Paracetamol 500mg, Batch: PCM24081.
   - Deduction: -1 unit.
   - Stock reduced from 20 -> 19 units.
4. Check `/transactions` to verify the permanent audit log entry.

### Test 3: Expired Medicine Defense
1. Go to `/sales`.
2. Click **Tap EXPIRED Cetirizine (12:34:56:78)**.
3. Observe:
   - Red rejection banner: "Medicine batch has expired. Sale blocked."
   - Inventory is **NOT** decremented.
   - A critical security alert is automatically logged in `/alerts`.

### Test 4: RFID Tag Registration & Pairing
1. Go to `/rfid/assign`.
2. Select Medicine: Amoxicillin, Batch: AMX99102.
3. Enter or tap tag UID `AA:BB:CC:DD`.
4. Click **Confirm & Pair RFID UID to Batch**.
5. Observe status becomes `ASSIGNED`. Click **Print Shelf Label Now** to generate a printable label.

### Test 5: RFID Label Printing
1. Go to `/rfid/print`.
2. Click **Print Label (Browser Print)**.
3. Observe standard pharmacy 80x50mm adhesive label format with barcodes and QR codes.

### Test 6: Supplier Email & Invoice Verification Queue
1. Go to `/email-import`.
2. Click **Fetch Supplier Emails**. Notice invoice emails detected.
3. Go to `/invoices` (Review Screen).
4. Click **Review & Verify** on Invoice `#INV-2026-9041`.
5. Edit any item quantity or expiration date.
6. Click **Verify & Commit to PostgreSQL**.
7. Observe new batches added to `/inventory` and restock transactions logged in `/transactions`.

### Test 7: ML Demand Prediction
1. Go to `/ml`.
2. Observe `Paracetamol 500mg` displays `MODEL TRAINED` with 30-day forecast.
3. Other medicines with under 5 sales display `"Not enough historical sales data"`.

---

## 11. Troubleshooting Guide

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **ESP32 Serial shows "WiFi disconnected"** | Incorrect SSID/Password or 5GHz WiFi | ESP32 only supports 2.4GHz WiFi networks. Check credentials in `smart_pharmacy.ino`. |
| **ESP32 shows "Connection failed"** | Wrong IP or port in `SERVER_BASE_URL` | Ensure your laptop and ESP32 are on the same WiFi network and use your computer's LAN IP (e.g. `192.168.1.x`). Check firewall permits port 8000. |
| **RC522 reader does not detect cards** | Loose SPI wiring or 5V used | Verify connections: SDA=5, SCK=18, MOSI=23, MISO=19, RST=22. Ensure VCC is 3.3V. |
| **PostgreSQL connection refused** | Daemon inactive | Run `sudo systemctl start postgresql` or change `DATABASE_URL` to `sqlite:///./pharma.db` in `.env`. |
| **Frontend shows Network Error** | Backend not running | Ensure `uvicorn main:app --port 8000` is running in another terminal. |
| **ThingSpeak error / 0 response** | Throttled / update within 15 seconds | ThingSpeak free tier requires 15 seconds between posts. System automatically throttles requests. |
