-- ============================================================================
-- SMART PHARMACY IoT SYSTEM - POSTGRESQL SCHEMA SETUP
-- ============================================================================

-- Create Database (Run as postgres superuser if creating from scratch)
-- CREATE DATABASE pharma_inventory;
-- \c pharma_inventory;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) DEFAULT 'pharmacist',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    manufacturer VARCHAR(255),
    category VARCHAR(100),
    dosage VARCHAR(100),
    form VARCHAR(100) DEFAULT 'Tablet',
    storage_instructions TEXT,
    min_temperature FLOAT DEFAULT 15.0,
    max_temperature FLOAT DEFAULT 25.0,
    min_humidity FLOAT DEFAULT 30.0,
    max_humidity FLOAT DEFAULT 65.0,
    reorder_level INTEGER DEFAULT 10,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Batches Table
CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    medicine_id INTEGER NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity_received INTEGER NOT NULL DEFAULT 0,
    quantity_remaining INTEGER NOT NULL DEFAULT 0,
    invoice_number VARCHAR(100),
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    received_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. RFID Tags Table
CREATE TABLE IF NOT EXISTS rfid_tags (
    id SERIAL PRIMARY KEY,
    uid VARCHAR(100) UNIQUE NOT NULL,
    batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
    medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'AVAILABLE',
    assigned_at TIMESTAMP WITHOUT TIME ZONE,
    printed_at TIMESTAMP WITHOUT TIME ZONE
);

-- 6. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
    id SERIAL PRIMARY KEY,
    rfid_uid VARCHAR(100),
    batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
    medicine_id INTEGER REFERENCES medicines(id) ON DELETE SET NULL,
    quantity INTEGER DEFAULT 1,
    transaction_type VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Sensor Readings Table (DHT22)
CREATE TABLE IF NOT EXISTS sensor_readings (
    id SERIAL PRIMARY KEY,
    temperature FLOAT NOT NULL,
    humidity FLOAT NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Alerts Table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    medicine_id INTEGER REFERENCES medicines(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES batches(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITHOUT TIME ZONE
);

-- 9. Email Imports Table
CREATE TABLE IF NOT EXISTS email_imports (
    id SERIAL PRIMARY KEY,
    sender VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    received_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'PENDING',
    raw_reference TEXT,
    processed_at TIMESTAMP WITHOUT TIME ZONE,
    error_message TEXT
);

-- 10. Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    invoice_date DATE DEFAULT CURRENT_DATE,
    file_name VARCHAR(255),
    import_status VARCHAR(50) DEFAULT 'PENDING_REVIEW',
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    medicine_name VARCHAR(255) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    expiry_date DATE NOT NULL,
    quantity INTEGER NOT NULL,
    manufacturer VARCHAR(255),
    parsed_data TEXT
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_rfid_tags_uid ON rfid_tags(uid);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_created ON sensor_readings(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_resolved ON alerts(resolved);
