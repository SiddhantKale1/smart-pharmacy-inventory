from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, date

# ----------------- Medicine Schemas -----------------
class MedicineBase(BaseModel):
    name: str
    generic_name: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = "Analgesic"
    dosage: Optional[str] = "500mg"
    form: Optional[str] = "Tablet"
    storage_instructions: Optional[str] = "Store below 25°C in a dry place"
    min_temperature: float = 15.0
    max_temperature: float = 25.0
    min_humidity: float = 30.0
    max_humidity: float = 65.0
    reorder_level: int = 10

class MedicineCreate(MedicineBase):
    pass

class MedicineUpdate(BaseModel):
    name: Optional[str] = None
    generic_name: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = None
    dosage: Optional[str] = None
    form: Optional[str] = None
    storage_instructions: Optional[str] = None
    min_temperature: Optional[float] = None
    max_temperature: Optional[float] = None
    min_humidity: Optional[float] = None
    max_humidity: Optional[float] = None
    reorder_level: Optional[int] = None

class MedicineOut(MedicineBase):
    id: int
    created_at: datetime
    total_stock: Optional[int] = 0

    class Config:
        from_attributes = True

# ----------------- Batch Schemas -----------------
class BatchBase(BaseModel):
    medicine_id: int
    batch_number: str
    expiry_date: date
    quantity_received: int
    quantity_remaining: int
    invoice_number: Optional[str] = None
    supplier_id: Optional[int] = None
    received_date: Optional[date] = None

class BatchCreate(BatchBase):
    pass

class BatchUpdate(BaseModel):
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None
    quantity_remaining: Optional[int] = None
    invoice_number: Optional[str] = None
    supplier_id: Optional[int] = None

class BatchOut(BatchBase):
    id: int
    created_at: datetime
    medicine_name: Optional[str] = None
    days_until_expiry: Optional[int] = None
    status: Optional[str] = None  # SAFE, EXPIRING SOON, EXPIRED

    class Config:
        from_attributes = True

# ----------------- RFID Schemas -----------------
class RFIDTagCreate(BaseModel):
    uid: str
    medicine_id: Optional[int] = None
    batch_id: Optional[int] = None
    status: Optional[str] = "AVAILABLE"

class RFIDTagAssign(BaseModel):
    uid: str
    medicine_id: int
    batch_id: int

class RFIDTagOut(BaseModel):
    id: int
    uid: str
    batch_id: Optional[int] = None
    medicine_id: Optional[int] = None
    status: str
    assigned_at: Optional[datetime] = None
    printed_at: Optional[datetime] = None
    medicine_name: Optional[str] = None
    batch_number: Optional[str] = None
    expiry_date: Optional[date] = None

    class Config:
        from_attributes = True

class RFIDScanRequest(BaseModel):
    uid: str

class RFIDScanResponse(BaseModel):
    success: bool
    message: str
    medicine: Optional[str] = None
    batch: Optional[str] = None
    remaining_quantity: Optional[int] = None
    transaction_id: Optional[int] = None
    status: Optional[str] = None

# ----------------- Transaction Schemas -----------------
class TransactionCreate(BaseModel):
    rfid_uid: Optional[str] = None
    batch_id: Optional[int] = None
    medicine_id: Optional[int] = None
    quantity: int = 1
    transaction_type: str = "SALE"  # SALE, RESTOCK, ADJUSTMENT, RETURN
    notes: Optional[str] = None

class TransactionOut(BaseModel):
    id: int
    rfid_uid: Optional[str] = None
    batch_id: Optional[int] = None
    medicine_id: Optional[int] = None
    medicine_name: Optional[str] = None
    batch_number: Optional[str] = None
    quantity: int
    transaction_type: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Sensor Schemas -----------------
class SensorReadingCreate(BaseModel):
    temperature: float
    humidity: float

class SensorReadingOut(BaseModel):
    id: int
    temperature: float
    humidity: float
    created_at: datetime

    class Config:
        from_attributes = True

class ClimateStatusOut(BaseModel):
    current_temperature: Optional[float] = None
    current_humidity: Optional[float] = None
    temperature_status: str = "NORMAL"  # NORMAL, WARNING, CRITICAL
    humidity_status: str = "NORMAL"     # NORMAL, WARNING, CRITICAL
    overall_status: str = "NORMAL"
    active_climate_alerts: int = 0
    last_updated: Optional[datetime] = None

# ----------------- Alert Schemas -----------------
class AlertCreate(BaseModel):
    alert_type: str
    severity: str
    message: str
    medicine_id: Optional[int] = None
    batch_id: Optional[int] = None

class AlertOut(BaseModel):
    id: int
    alert_type: str
    severity: str
    message: str
    medicine_id: Optional[int] = None
    batch_id: Optional[int] = None
    medicine_name: Optional[str] = None
    batch_number: Optional[str] = None
    created_at: datetime
    resolved: bool
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# ----------------- Supplier Schemas -----------------
class SupplierBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierOut(SupplierBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Email & Invoice Schemas -----------------
class EmailImportOut(BaseModel):
    id: int
    sender: str
    subject: str
    received_at: datetime
    status: str
    raw_reference: Optional[str] = None
    processed_at: Optional[datetime] = None
    error_message: Optional[str] = None

    class Config:
        from_attributes = True

class InvoiceItemReview(BaseModel):
    medicine_name: str
    generic_name: Optional[str] = None
    manufacturer: Optional[str] = None
    category: Optional[str] = "General"
    dosage: Optional[str] = "500mg"
    form: Optional[str] = "Tablet"
    batch_number: str
    expiry_date: date
    quantity: int
    min_temperature: Optional[float] = 15.0
    max_temperature: Optional[float] = 25.0
    min_humidity: Optional[float] = 30.0
    max_humidity: Optional[float] = 65.0
    reorder_level: Optional[int] = 10

class InvoiceReviewConfirmRequest(BaseModel):
    invoice_number: str
    supplier_name: str
    invoice_date: date
    items: List[InvoiceItemReview]

class InvoiceOut(BaseModel):
    id: int
    invoice_number: str
    supplier_id: Optional[int] = None
    supplier_name: Optional[str] = None
    invoice_date: Optional[date] = None
    file_name: Optional[str] = None
    import_status: str
    created_at: datetime
    item_count: int = 0

    class Config:
        from_attributes = True

# ----------------- Inventory Item View -----------------
class InventoryItemOut(BaseModel):
    batch_id: int
    medicine_id: int
    medicine_name: str
    generic_name: Optional[str] = None
    manufacturer: Optional[str] = None
    batch_number: str
    expiry_date: date
    days_until_expiry: int
    quantity_received: int
    quantity_remaining: int
    reorder_level: int
    rfid_assigned: bool
    rfid_uid: Optional[str] = None
    rfid_status: Optional[str] = "AVAILABLE"
    min_temperature: float
    max_temperature: float
    min_humidity: float
    max_humidity: float
    inventory_status: str  # IN STOCK, LOW STOCK, OUT OF STOCK, EXPIRING SOON, EXPIRED

# ----------------- Dashboard & IoT -----------------
class DashboardSummary(BaseModel):
    total_medicines: int
    total_batches: int
    total_inventory_units: int
    low_stock_count: int
    expiring_soon_count: int
    expired_count: int
    active_alerts_count: int
    current_temperature: Optional[float] = None
    current_humidity: Optional[float] = None
    temperature_status: str
    humidity_status: str
    thingspeak_synced: bool
    recent_rfid_scans: int

class ThingSpeakStatus(BaseModel):
    configured: bool
    channel_id: Optional[str] = None
    last_feed_time: Optional[str] = None
    status: str
    field_mappings: Dict[str, str]

class DemandPredictionItem(BaseModel):
    medicine_id: int
    medicine_name: str
    current_stock: int
    predicted_demand_30d: float
    suggested_reorder_qty: int
    model_status: str  # TRAINED, INSUFFICIENT_DATA
    message: Optional[str] = None
