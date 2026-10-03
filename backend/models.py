import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    email = Column(String(255), unique=True, nullable=False)
    role = Column(String(50), default="pharmacist")  # admin, pharmacist, staff
    created_at = Column(DateTime, default=datetime.datetime.utcnow)


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    contact_person = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    address = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    batches = relationship("Batch", back_populates="supplier")
    invoices = relationship("Invoice", back_populates="supplier")


class Medicine(Base):
    __tablename__ = "medicines"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False, index=True)
    generic_name = Column(String(255), nullable=True)
    manufacturer = Column(String(255), nullable=True)
    category = Column(String(100), nullable=True)  # Analgesic, Antibiotic, Antihistamine, etc.
    dosage = Column(String(100), nullable=True)    # 500mg, 10mg, 5ml
    form = Column(String(100), default="Tablet")   # Tablet, Capsule, Syrup, Injection, Cream
    storage_instructions = Column(Text, nullable=True)
    min_temperature = Column(Float, default=15.0)  # °C
    max_temperature = Column(Float, default=25.0)  # °C
    min_humidity = Column(Float, default=30.0)     # %
    max_humidity = Column(Float, default=65.0)     # %
    reorder_level = Column(Integer, default=10)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    batches = relationship("Batch", back_populates="medicine", cascade="all, delete-orphan")
    rfid_tags = relationship("RFIDTag", back_populates="medicine")
    transactions = relationship("Transaction", back_populates="medicine")
    alerts = relationship("Alert", back_populates="medicine")


class Batch(Base):
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=False)
    batch_number = Column(String(100), nullable=False, index=True)
    expiry_date = Column(Date, nullable=False, index=True)
    quantity_received = Column(Integer, nullable=False, default=0)
    quantity_remaining = Column(Integer, nullable=False, default=0)
    invoice_number = Column(String(100), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    received_date = Column(Date, default=datetime.date.today)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    medicine = relationship("Medicine", back_populates="batches")
    supplier = relationship("Supplier", back_populates="batches")
    rfid_tags = relationship("RFIDTag", back_populates="batch")
    transactions = relationship("Transaction", back_populates="batch")
    alerts = relationship("Alert", back_populates="batch")


class RFIDTag(Base):
    __tablename__ = "rfid_tags"

    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String(100), unique=True, nullable=False, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="AVAILABLE")  # AVAILABLE, ASSIGNED, SOLD, DISABLED
    assigned_at = Column(DateTime, nullable=True)
    printed_at = Column(DateTime, nullable=True)

    batch = relationship("Batch", back_populates="rfid_tags")
    medicine = relationship("Medicine", back_populates="rfid_tags")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    rfid_uid = Column(String(100), nullable=True, index=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="SET NULL"), nullable=True)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="SET NULL"), nullable=True)
    quantity = Column(Integer, default=1)
    transaction_type = Column(String(50), nullable=False)  # SALE, RESTOCK, ADJUSTMENT, RETURN
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)

    batch = relationship("Batch", back_populates="transactions")
    medicine = relationship("Medicine", back_populates="transactions")


class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    temperature = Column(Float, nullable=False)
    humidity = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    alert_type = Column(String(50), nullable=False, index=True)  # EXPIRY, STOCK, TEMPERATURE, HUMIDITY, RFID, SYSTEM
    severity = Column(String(50), nullable=False)                # INFO, WARNING, CRITICAL
    message = Column(Text, nullable=False)
    medicine_id = Column(Integer, ForeignKey("medicines.id", ondelete="CASCADE"), nullable=True)
    batch_id = Column(Integer, ForeignKey("batches.id", ondelete="CASCADE"), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, index=True)
    resolved = Column(Boolean, default=False, index=True)
    resolved_at = Column(DateTime, nullable=True)

    medicine = relationship("Medicine", back_populates="alerts")
    batch = relationship("Batch", back_populates="alerts")


class EmailImport(Base):
    __tablename__ = "email_imports"

    id = Column(Integer, primary_key=True, index=True)
    sender = Column(String(255), nullable=False)
    subject = Column(String(500), nullable=False)
    received_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(50), default="PENDING")  # PENDING, PROCESSED, FAILED
    raw_reference = Column(Text, nullable=True)
    processed_at = Column(DateTime, nullable=True)
    error_message = Column(Text, nullable=True)


class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    invoice_number = Column(String(100), unique=True, nullable=False, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id", ondelete="SET NULL"), nullable=True)
    invoice_date = Column(Date, default=datetime.date.today)
    file_name = Column(String(255), nullable=True)
    import_status = Column(String(50), default="PENDING_REVIEW")  # PENDING_REVIEW, CONFIRMED, REJECTED
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    supplier = relationship("Supplier", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id", ondelete="CASCADE"), nullable=False)
    medicine_name = Column(String(255), nullable=False)
    batch_number = Column(String(100), nullable=False)
    expiry_date = Column(Date, nullable=False)
    quantity = Column(Integer, nullable=False)
    manufacturer = Column(String(255), nullable=True)
    parsed_data = Column(Text, nullable=True)

    invoice = relationship("Invoice", back_populates="items")
