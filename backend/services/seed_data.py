import datetime
from sqlalchemy.orm import Session
from models import User, Supplier, Medicine, Batch, RFIDTag, Transaction, SensorReading, Alert, Invoice, InvoiceItem, EmailImport
from services.inventory_service import check_and_create_expiry_and_stock_alerts
from services.email_service import stage_invoice, SAMPLE_SUPPLIER_EMAILS, parse_invoice_text

def seed_database(db: Session):
    # Check if already seeded
    if db.query(Medicine).first():
        return
        
    print("Seeding Smart Pharmacy Database with realistic clinical demo data...")
    today = datetime.date.today()
    
    # 1. Users
    user = User(
        username="pharmacist_admin",
        email="admin@apexpharma.com",
        role="admin"
    )
    db.add(user)
    
    # 2. Suppliers
    s1 = Supplier(
        name="MedSupply Global Ltd",
        contact_person="David Vance",
        email="orders@medsupplyglobal.com",
        phone="+1-800-555-0144",
        address="44 Distribution Blvd, Pharma Logistics Park"
    )
    s2 = Supplier(
        name="BioHealth Distributors",
        contact_person="Sarah Jenkins",
        email="dispatch@biohealthpharma.com",
        phone="+1-800-555-0188",
        address="12 Biotech Corridor, North Bay"
    )
    s3 = Supplier(
        name="Apex Pharma Wholesale",
        contact_person="Ravi Kumar",
        email="ravi@apexwholesale.com",
        phone="+1-800-555-0199",
        address="89 Commerce Way, Central Hub"
    )
    db.add_all([s1, s2, s3])
    db.flush()
    
    # 3. Medicines
    m_paracetamol = Medicine(
        name="Paracetamol 500mg",
        generic_name="Acetaminophen",
        manufacturer="GlaxoSmithKline",
        category="Analgesic / Antipyretic",
        dosage="500mg",
        form="Tablet",
        storage_instructions="Store below 25°C in a dry place. Protect from direct sunlight.",
        min_temperature=15.0,
        max_temperature=25.0,
        min_humidity=30.0,
        max_humidity=65.0,
        reorder_level=10
    )
    m_amoxicillin = Medicine(
        name="Amoxicillin 500mg",
        generic_name="Amoxicillin Trihydrate",
        manufacturer="Pfizer Inc",
        category="Antibiotic (Penicillin)",
        dosage="500mg",
        form="Capsule",
        storage_instructions="Keep tightly closed in a cool, dry place between 15°C and 25°C.",
        min_temperature=15.0,
        max_temperature=25.0,
        min_humidity=30.0,
        max_humidity=60.0,
        reorder_level=15
    )
    m_cetirizine = Medicine(
        name="Cetirizine 10mg",
        generic_name="Cetirizine Hydrochloride",
        manufacturer="Sun Pharma",
        category="Antihistamine",
        dosage="10mg",
        form="Tablet",
        storage_instructions="Store below 30°C. Protect from moisture and light.",
        min_temperature=15.0,
        max_temperature=30.0,
        min_humidity=30.0,
        max_humidity=65.0,
        reorder_level=8
    )
    m_azithromycin = Medicine(
        name="Azithromycin 500mg",
        generic_name="Azithromycin Dihydrate",
        manufacturer="Cipla Ltd",
        category="Macrolide Antibiotic",
        dosage="500mg",
        form="Tablet",
        storage_instructions="Store below 25°C. Keep away from heat.",
        min_temperature=15.0,
        max_temperature=25.0,
        min_humidity=30.0,
        max_humidity=65.0,
        reorder_level=10
    )
    m_ibuprofen = Medicine(
        name="Ibuprofen 400mg",
        generic_name="Ibuprofen",
        manufacturer="Abbott Laboratories",
        category="NSAID (Anti-inflammatory)",
        dosage="400mg",
        form="Tablet",
        storage_instructions="Store in dry place between 15°C and 25°C.",
        min_temperature=15.0,
        max_temperature=25.0,
        min_humidity=30.0,
        max_humidity=60.0,
        reorder_level=12
    )
    
    db.add_all([m_paracetamol, m_amoxicillin, m_cetirizine, m_azithromycin, m_ibuprofen])
    db.flush()
    
    # 4. Batches
    # Paracetamol: Expiring in 22 days!
    b_paracetamol = Batch(
        medicine_id=m_paracetamol.id,
        batch_number="PCM24081",
        expiry_date=today + datetime.timedelta(days=22),
        quantity_received=50,
        quantity_remaining=20,
        invoice_number="INV-2026-8801",
        supplier_id=s1.id,
        received_date=today - datetime.timedelta(days=90)
    )
    # Amoxicillin: Safe
    b_amoxicillin = Batch(
        medicine_id=m_amoxicillin.id,
        batch_number="AMX99102",
        expiry_date=today + datetime.timedelta(days=540),
        quantity_received=100,
        quantity_remaining=45,
        invoice_number="INV-2026-8812",
        supplier_id=s2.id,
        received_date=today - datetime.timedelta(days=45)
    )
    # Cetirizine: EXPIRED (10 days ago)
    b_cetirizine = Batch(
        medicine_id=m_cetirizine.id,
        batch_number="CTZ33410",
        expiry_date=today - datetime.timedelta(days=10),
        quantity_received=40,
        quantity_remaining=15,
        invoice_number="INV-2026-7201",
        supplier_id=s3.id,
        received_date=today - datetime.timedelta(days=380)
    )
    # Azithromycin: LOW STOCK (4 units left, reorder level 10)
    b_azithromycin = Batch(
        medicine_id=m_azithromycin.id,
        batch_number="AZT55021",
        expiry_date=today + datetime.timedelta(days=320),
        quantity_received=30,
        quantity_remaining=4,
        invoice_number="INV-2026-8940",
        supplier_id=s1.id,
        received_date=today - datetime.timedelta(days=60)
    )
    # Ibuprofen: Safe
    b_ibuprofen = Batch(
        medicine_id=m_ibuprofen.id,
        batch_number="IBU88390",
        expiry_date=today + datetime.timedelta(days=400),
        quantity_received=80,
        quantity_remaining=60,
        invoice_number="INV-2026-9011",
        supplier_id=s2.id,
        received_date=today - datetime.timedelta(days=30)
    )
    
    db.add_all([b_paracetamol, b_amoxicillin, b_cetirizine, b_azithromycin, b_ibuprofen])
    db.flush()
    
    # 5. RFID Tags
    rfid1 = RFIDTag(
        uid="43:A7:2C:19",
        medicine_id=m_paracetamol.id,
        batch_id=b_paracetamol.id,
        status="ASSIGNED",
        assigned_at=datetime.datetime.utcnow() - datetime.timedelta(days=30),
        printed_at=datetime.datetime.utcnow() - datetime.timedelta(days=30)
    )
    rfid2 = RFIDTag(
        uid="A1:B2:C3:D4",
        medicine_id=m_amoxicillin.id,
        batch_id=b_amoxicillin.id,
        status="ASSIGNED",
        assigned_at=datetime.datetime.utcnow() - datetime.timedelta(days=20),
        printed_at=datetime.datetime.utcnow() - datetime.timedelta(days=20)
    )
    rfid3 = RFIDTag(
        uid="E5:F6:17:28",
        medicine_id=m_azithromycin.id,
        batch_id=b_azithromycin.id,
        status="ASSIGNED",
        assigned_at=datetime.datetime.utcnow() - datetime.timedelta(days=15),
        printed_at=datetime.datetime.utcnow() - datetime.timedelta(days=15)
    )
    rfid4 = RFIDTag(
        uid="99:88:77:66",
        medicine_id=m_ibuprofen.id,
        batch_id=b_ibuprofen.id,
        status="ASSIGNED",
        assigned_at=datetime.datetime.utcnow() - datetime.timedelta(days=10),
        printed_at=datetime.datetime.utcnow() - datetime.timedelta(days=10)
    )
    rfid5 = RFIDTag(
        uid="12:34:56:78",
        medicine_id=m_cetirizine.id,
        batch_id=b_cetirizine.id,
        status="ASSIGNED",
        assigned_at=datetime.datetime.utcnow() - datetime.timedelta(days=100),
        printed_at=datetime.datetime.utcnow() - datetime.timedelta(days=100)
    )
    # Available tag for student/live demo assignment:
    rfid_free = RFIDTag(
        uid="AA:BB:CC:DD",
        status="AVAILABLE"
    )
    db.add_all([rfid1, rfid2, rfid3, rfid4, rfid5, rfid_free])
    
    # 6. Historical Sales & Restock Transactions (for ML & Audit logs)
    base_time = datetime.datetime.utcnow() - datetime.timedelta(days=15)
    # Give Paracetamol 6 sales so ML regression can train!
    sales_paracetamol = [
        (base_time + datetime.timedelta(days=1), 2),
        (base_time + datetime.timedelta(days=3), 3),
        (base_time + datetime.timedelta(days=6), 4),
        (base_time + datetime.timedelta(days=9), 2),
        (base_time + datetime.timedelta(days=12), 5),
        (base_time + datetime.timedelta(days=14), 3),
    ]
    for ts, q in sales_paracetamol:
        db.add(Transaction(
            rfid_uid="43:A7:2C:19",
            batch_id=b_paracetamol.id,
            medicine_id=m_paracetamol.id,
            quantity=q,
            transaction_type="SALE",
            notes="Dispensed via RFID tap",
            created_at=ts
        ))
        
    # Give other medicines fewer sales so "Not enough historical sales data" is shown for them!
    db.add(Transaction(
        rfid_uid="A1:B2:C3:D4",
        batch_id=b_amoxicillin.id,
        medicine_id=m_amoxicillin.id,
        quantity=1,
        transaction_type="SALE",
        notes="Prescription dispensed",
        created_at=base_time + datetime.timedelta(days=10)
    ))
    
    # 7. Recent Sensor Readings (DHT22)
    now = datetime.datetime.utcnow()
    readings = [
        (now - datetime.timedelta(minutes=45), 21.8, 48.2),
        (now - datetime.timedelta(minutes=30), 22.1, 49.0),
        (now - datetime.timedelta(minutes=20), 22.6, 50.1),
        (now - datetime.timedelta(minutes=10), 22.4, 48.7),
        (now, 22.5, 47.9),
    ]
    for ts, t, h in readings:
        db.add(SensorReading(
            temperature=t,
            humidity=h,
            created_at=ts
        ))
        
    db.commit()
    
    # 8. Trigger alert checks
    check_and_create_expiry_and_stock_alerts(db)
    
    # 9. Stage initial sample email and invoice for staff review demo
    sample = SAMPLE_SUPPLIER_EMAILS[0]
    parsed = parse_invoice_text(sample["body"])
    stage_invoice(db, parsed, sample["sender"], sample["subject"], sample["body"])
    
    print("Database seeding completed successfully!")
