# Smart Pharmacy IoT REST API Reference

The FastAPI backend provides auto-generated OpenAPI documentation accessible at:
- **Interactive Swagger UI**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 1. Hardware Gateway APIs (ESP32 Integration)

### 1.1 Ingest RFID Scan / POS Checkout
Handles RFID card taps from RC522 or POS terminal. Checks stock, prevents sale of expired medicines, decrements stock, and returns updated count.

- **Endpoint**: `POST /api/rfid/scan`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "uid": "43:A7:2C:19"
}
```

**Response (Success - Sale Approved):**
```json
{
  "success": true,
  "message": "Sale recorded",
  "medicine": "Paracetamol 500mg",
  "batch": "PCM24081",
  "remaining_quantity": 19,
  "transaction_id": 14,
  "status": "COMPLETED"
}
```

**Response (Blocked - Expired Batch):**
```json
{
  "success": false,
  "message": "Medicine batch has expired. Sale blocked.",
  "medicine": "Cetirizine 10mg",
  "batch": "CTZ33410",
  "remaining_quantity": 15
}
```

**Response (Unknown Tag):**
```json
{
  "success": false,
  "message": "Unknown RFID tag",
  "medicine": null,
  "batch": null,
  "remaining_quantity": null
}
```

---

### 1.2 Ingest Climate Readings (DHT22)
Ingests digital temperature and relative humidity from ESP32 GPIO 27. Checks cold-chain thresholds and forwards telemetry to ThingSpeak.

- **Endpoint**: `POST /api/sensor`
- **Content-Type**: `application/json`

**Request Body:**
```json
{
  "temperature": 23.4,
  "humidity": 48.5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Telemetry received and processed",
  "temperature": 23.4,
  "humidity": 48.5,
  "temperature_status": "NORMAL",
  "humidity_status": "NORMAL",
  "overall_status": "NORMAL"
}
```

---

## 2. Inventory & RFID Registry APIs

### 2.1 Get Full Inventory
- **Endpoint**: `GET /api/inventory?status={status}&search={search}`
- **Query Params**:
  - `status`: Filter by `IN STOCK`, `LOW STOCK`, `EXPIRING SOON`, `EXPIRED`, `OUT OF STOCK`
  - `search`: Search query string

### 2.2 Register / Pair RFID Tag
- **Endpoint**: `POST /api/rfid/register`
- **Request Body:**
```json
{
  "uid": "43:A7:2C:19",
  "medicine_id": 1,
  "batch_id": 1
}
```

### 2.3 Mark RFID Label as Printed
- **Endpoint**: `POST /api/rfid/print-label/{tag_id}`

---

## 3. Alerts & Expiry Monitoring

### 3.1 Get Alerts
- **Endpoint**: `GET /api/alerts?category={category}&severity={severity}&resolved={bool}`
- **Categories**: `EXPIRY`, `STOCK`, `TEMPERATURE`, `HUMIDITY`, `RFID`, `SYSTEM`
- **Severities**: `CRITICAL`, `WARNING`, `INFO`

### 3.2 Resolve Alert
- **Endpoint**: `POST /api/alerts/{id}/resolve`

---

## 4. Email Ingestion & Invoices

### 4.1 Trigger IMAP Email Fetch
- **Endpoint**: `POST /api/email/import`

### 4.2 Confirm & Import Invoice into PostgreSQL
- **Endpoint**: `POST /api/invoices/{id}/confirm`
- **Request Body:**
```json
{
  "invoice_number": "INV-2026-9041",
  "supplier_name": "MedSupply Global Ltd",
  "invoice_date": "2026-10-01",
  "items": [
    {
      "medicine_name": "Paracetamol 500mg",
      "generic_name": "Acetaminophen",
      "manufacturer": "GlaxoSmithKline",
      "category": "Analgesic",
      "dosage": "500mg",
      "form": "Tablet",
      "batch_number": "PCM24099",
      "expiry_date": "2027-11-30",
      "quantity": 50,
      "min_temperature": 15.0,
      "max_temperature": 25.0,
      "min_humidity": 30.0,
      "max_humidity": 65.0,
      "reorder_level": 10
    }
  ]
}
```

---

## 5. Machine Learning & Forecasting

### 5.1 Get 30-Day Demand Prediction
- **Endpoint**: `GET /api/ml/demand-prediction`
- **Response Format:**
```json
[
  {
    "medicine_id": 1,
    "medicine_name": "Paracetamol 500mg",
    "current_stock": 20,
    "predicted_demand_30d": 158.7,
    "suggested_reorder_qty": 139,
    "model_status": "TRAINED",
    "message": "Model trained on historical sales transactions"
  },
  {
    "medicine_id": 2,
    "medicine_name": "Amoxicillin 500mg",
    "current_stock": 45,
    "predicted_demand_30d": 0.0,
    "suggested_reorder_qty": 0,
    "model_status": "INSUFFICIENT_DATA",
    "message": "Not enough historical sales data (1/5 records found)"
  }
]
```
