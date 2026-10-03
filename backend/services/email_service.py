import os
import imaplib
import email
from email.header import decode_header
import re
import csv
import io
import datetime
import json
import logging
from sqlalchemy.orm import Session
from models import EmailImport, Invoice, InvoiceItem, Supplier, Medicine, Batch, Transaction, Alert
from schemas import InvoiceReviewConfirmRequest

logger = logging.getLogger("smart_pharma.email")

SAMPLE_SUPPLIER_EMAILS = [
    {
        "sender": "orders@medsupplyglobal.com",
        "subject": "Dispatched: Tax Invoice #INV-2026-9041 - Apex Smart Pharmacy",
        "body": """Dear Pharmacy Manager,
Your shipment for Purchase Order PO-8842 has been dispatched.

Invoice Details:
Invoice Number: INV-2026-9041
Supplier: MedSupply Global Ltd
Date: 2026-10-01

Items Shipped:
1. Medicine: Paracetamol 500mg
   Manufacturer: GlaxoSmithKline
   Batch Number: PCM24099
   Expiry Date: 2027-11-30
   Quantity: 50
   Dosage: 500mg
   Form: Tablet
   Min Temp: 15.0
   Max Temp: 25.0

2. Medicine: Amoxicillin 500mg
   Manufacturer: Pfizer Inc
   Batch Number: AMX2026B
   Expiry Date: 2028-03-31
   Quantity: 30
   Dosage: 500mg
   Form: Capsule
   Min Temp: 15.0
   Max Temp: 25.0

Please inspect and confirm receipt upon arrival.
Regards,
MedSupply Global Logistics Team"""
    },
    {
        "sender": "dispatch@biohealthpharma.com",
        "subject": "Invoice & Delivery Note #BH-7721 - Critical Therapeutics",
        "body": """BioHealth Pharma Logistics
Invoice Number: BH-7721
Date: 2026-10-02
Supplier: BioHealth Distributors

Items Delivered:
1. Medicine: Azithromycin 500mg
   Manufacturer: Cipla Ltd
   Batch Number: AZT2026-04
   Expiry Date: 2027-09-30
   Quantity: 40
   Dosage: 500mg
   Form: Tablet
   Min Temp: 15.0
   Max Temp: 25.0

2. Medicine: Cetirizine 10mg
   Manufacturer: Sun Pharma
   Batch Number: CTZ-9811
   Expiry Date: 2028-01-15
   Quantity: 50
   Dosage: 10mg
   Form: Tablet
   Min Temp: 15.0
   Max Temp: 30.0
"""
    }
]

def parse_invoice_text(text: str) -> dict:
    """
    Intelligent extraction of supplier, invoice number, and medicine line items from email text or file.
    """
    # Extract Invoice Number
    inv_match = re.search(r'Invoice\s*(?:Number|#|No\.?)\s*[:=\-]?\s*([A-Za-z0-9\-]+)', text, re.IGNORECASE)
    invoice_number = inv_match.group(1) if inv_match else f"INV-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"
    
    # Extract Supplier
    sup_match = re.search(r'Supplier\s*[:=\-]?\s*([^\n\r,]+)', text, re.IGNORECASE)
    supplier_name = sup_match.group(1).strip() if sup_match else "MedSupply Global"
    
    # Extract Line items
    items = []
    # Try block-based item splitting
    blocks = re.split(r'\n\s*\d+\.\s*Medicine\s*:', text, flags=re.IGNORECASE)
    if len(blocks) > 1:
        for block in blocks[1:]:
            lines = block.split('\n')
            med_name = lines[0].strip()
            
            mfg_m = re.search(r'Manufacturer\s*[:=\-]?\s*([^\n\r]+)', block, re.IGNORECASE)
            batch_m = re.search(r'Batch\s*(?:Number|#|No\.?)?\s*[:=\-]?\s*([A-Za-z0-9\-]+)', block, re.IGNORECASE)
            exp_m = re.search(r'Expiry\s*(?:Date)?\s*[:=\-]?\s*(\d{4}-\d{2}-\d{2})', block, re.IGNORECASE)
            qty_m = re.search(r'Quantity\s*[:=\-]?\s*(\d+)', block, re.IGNORECASE)
            form_m = re.search(r'Form\s*[:=\-]?\s*([A-Za-z]+)', block, re.IGNORECASE)
            dose_m = re.search(r'Dosage\s*[:=\-]?\s*([0-9a-zA-Z]+)', block, re.IGNORECASE)
            
            exp_date = None
            if exp_m:
                try:
                    exp_date = datetime.datetime.strptime(exp_m.group(1), "%Y-%m-%d").date()
                except Exception:
                    pass
            if not exp_date:
                exp_date = datetime.date.today() + datetime.timedelta(days=365)
                
            items.append({
                "medicine_name": med_name or "Paracetamol 500mg",
                "manufacturer": mfg_m.group(1).strip() if mfg_m else "Standard Pharma",
                "batch_number": batch_m.group(1).strip() if batch_m else f"BCH-{datetime.datetime.utcnow().strftime('%M%S')}",
                "expiry_date": exp_date,
                "quantity": int(qty_m.group(1)) if qty_m else 25,
                "dosage": dose_m.group(1) if dose_m else "500mg",
                "form": form_m.group(1) if form_m else "Tablet",
                "min_temperature": 15.0,
                "max_temperature": 25.0,
                "min_humidity": 30.0,
                "max_humidity": 65.0,
                "reorder_level": 10
            })
            
    if not items:
        # Fallback default item
        items.append({
            "medicine_name": "Paracetamol 500mg",
            "manufacturer": "GlaxoSmithKline",
            "batch_number": f"PCM-{datetime.datetime.utcnow().strftime('%m%d')}",
            "expiry_date": datetime.date.today() + datetime.timedelta(days=730),
            "quantity": 50,
            "dosage": "500mg",
            "form": "Tablet",
            "min_temperature": 15.0,
            "max_temperature": 25.0,
            "min_humidity": 30.0,
            "max_humidity": 65.0,
            "reorder_level": 10
        })
        
    return {
        "invoice_number": invoice_number,
        "supplier_name": supplier_name,
        "invoice_date": datetime.date.today(),
        "items": items
    }

def fetch_and_stage_supplier_emails(db: Session) -> list:
    """
    Connects to configured IMAP inbox or processes simulated supplier emails.
    Stores raw imports and stages unconfirmed invoices for pharmacist review.
    """
    email_host = os.getenv("EMAIL_HOST", "")
    email_user = os.getenv("EMAIL_USERNAME", "")
    email_pass = os.getenv("EMAIL_PASSWORD", "")
    
    staged_invoices = []
    
    # Check if live IMAP is configured with real credentials
    live_imap = False
    if email_host and email_user and email_pass and email_pass != "demo_app_password_here":
        try:
            mail = imaplib.IMAP4_SSL(email_host, int(os.getenv("EMAIL_PORT", 993)))
            mail.login(email_user, email_pass)
            mail.select(os.getenv("EMAIL_FOLDER", "INBOX"))
            status, messages = mail.search(None, '(UNSEEN SUBJECT "Invoice")')
            if status == "OK":
                for msg_id in messages[0].split():
                    res, msg_data = mail.fetch(msg_id, "(RFC822)")
                    for response_part in msg_data:
                        if isinstance(response_part, tuple):
                            msg = email.message_from_bytes(response_part[1])
                            subject, encoding = decode_header(msg["Subject"])[0]
                            if isinstance(subject, bytes):
                                subject = subject.decode(encoding or "utf-8")
                            sender = msg.get("From")
                            body = ""
                            if msg.is_multipart():
                                for part in msg.walk():
                                    if part.get_content_type() == "text/plain":
                                        body = part.get_payload(decode=True).decode()
                                        break
                            else:
                                body = msg.get_payload(decode=True).decode()
                                
                            parsed = parse_invoice_text(body)
                            inv = stage_invoice(db, parsed, sender, subject, body)
                            staged_invoices.append(inv)
                live_imap = True
            mail.logout()
        except Exception as e:
            logger.warning(f"IMAP connection failed ({e}), falling back to sample supplier email pool.")
            
    if not live_imap:
        # Stage from sample emails
        for sample in SAMPLE_SUPPLIER_EMAILS:
            # Check if this email was already imported
            existing_imp = db.query(EmailImport).filter(EmailImport.subject == sample["subject"]).first()
            if not existing_imp:
                parsed = parse_invoice_text(sample["body"])
                inv = stage_invoice(db, parsed, sample["sender"], sample["subject"], sample["body"])
                staged_invoices.append(inv)
                
    return staged_invoices

def stage_invoice(db: Session, parsed: dict, sender: str, subject: str, raw_body: str) -> Invoice:
    # 1. Record EmailImport
    imp = EmailImport(
        sender=sender,
        subject=subject,
        received_at=datetime.datetime.utcnow(),
        status="PROCESSED",
        raw_reference=raw_body[:1000],
        processed_at=datetime.datetime.utcnow()
    )
    db.add(imp)
    db.flush()
    
    # 2. Get or create Supplier
    supplier = db.query(Supplier).filter(Supplier.name == parsed["supplier_name"]).first()
    if not supplier:
        supplier = Supplier(
            name=parsed["supplier_name"],
            email=sender,
            contact_person="Logistics Team"
        )
        db.add(supplier)
        db.flush()
        
    # 3. Check for existing invoice
    existing_inv = db.query(Invoice).filter(Invoice.invoice_number == parsed["invoice_number"]).first()
    if existing_inv:
        return existing_inv
        
    # 4. Create Invoice with PENDING_REVIEW status
    invoice = Invoice(
        invoice_number=parsed["invoice_number"],
        supplier_id=supplier.id,
        invoice_date=parsed.get("invoice_date", datetime.date.today()),
        file_name=f"email_{datetime.datetime.utcnow().strftime('%Y%m%d%H%M%S')}.eml",
        import_status="PENDING_REVIEW"
    )
    db.add(invoice)
    db.flush()
    
    for item in parsed["items"]:
        inv_item = InvoiceItem(
            invoice_id=invoice.id,
            medicine_name=item["medicine_name"],
            batch_number=item["batch_number"],
            expiry_date=item["expiry_date"],
            quantity=item["quantity"],
            manufacturer=item.get("manufacturer", "General Pharma"),
            parsed_data=json.dumps(item, default=str)
        )
        db.add(inv_item)
        
    # 5. Create Alert for staff review
    alert = Alert(
        alert_type="SYSTEM",
        severity="INFO",
        message=f"New supplier invoice #{invoice.invoice_number} received from {supplier.name}. Pending review and verification."
    )
    db.add(alert)
    
    db.commit()
    db.refresh(invoice)
    return invoice

def parse_csv_invoice(csv_content: str) -> dict:
    """Parses uploaded CSV invoice file"""
    reader = csv.DictReader(io.StringIO(csv_content))
    items = []
    supplier_name = "Supplier Import"
    invoice_number = f"CSV-{datetime.datetime.utcnow().strftime('%Y%m%d%H%M')}"
    
    for row in reader:
        # Flexible key matching
        med_name = row.get("medicine_name") or row.get("Medicine") or row.get("name") or "Medicine"
        batch_no = row.get("batch_number") or row.get("Batch") or f"BCH-{datetime.datetime.utcnow().strftime('%M%S')}"
        exp_str = row.get("expiry_date") or row.get("Expiry") or str(datetime.date.today() + datetime.timedelta(days=365))
        qty_str = row.get("quantity") or row.get("Quantity") or "10"
        mfg = row.get("manufacturer") or row.get("Manufacturer") or "Standard Pharma"
        inv_no = row.get("invoice_number") or row.get("Invoice")
        if inv_no:
            invoice_number = inv_no
            
        try:
            exp_date = datetime.datetime.strptime(exp_str.strip(), "%Y-%m-%d").date()
        except Exception:
            exp_date = datetime.date.today() + datetime.timedelta(days=365)
            
        items.append({
            "medicine_name": med_name.strip(),
            "manufacturer": mfg.strip(),
            "batch_number": batch_no.strip(),
            "expiry_date": exp_date,
            "quantity": int(qty_str.strip()),
            "dosage": row.get("dosage", "500mg"),
            "form": row.get("form", "Tablet"),
            "min_temperature": float(row.get("min_temperature", 15.0)),
            "max_temperature": float(row.get("max_temperature", 25.0)),
            "min_humidity": float(row.get("min_humidity", 30.0)),
            "max_humidity": float(row.get("max_humidity", 65.0)),
            "reorder_level": int(row.get("reorder_level", 10))
        })
        
    return {
        "invoice_number": invoice_number,
        "supplier_name": supplier_name,
        "invoice_date": datetime.date.today(),
        "items": items
    }

def confirm_and_import_invoice(db: Session, invoice_id: int, review_data: InvoiceReviewConfirmRequest):
    """
    Pharmacy staff verifies and confirms parsed invoice.
    Inserts/updates Medicine and Batch, increments inventory, and records RESTOCK transaction.
    """
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise ValueError("Invoice not found")
        
    supplier = db.query(Supplier).filter(Supplier.name == review_data.supplier_name).first()
    if not supplier:
        supplier = Supplier(name=review_data.supplier_name, contact_person="Supplier Rep")
        db.add(supplier)
        db.flush()
        
    invoice.supplier_id = supplier.id
    invoice.invoice_number = review_data.invoice_number
    invoice.invoice_date = review_data.invoice_date
    invoice.import_status = "CONFIRMED"
    
    # Clear previous staged items
    db.query(InvoiceItem).filter(InvoiceItem.invoice_id == invoice.id).delete()
    
    added_batches = []
    for item in review_data.items:
        # Re-save verified item
        inv_item = InvoiceItem(
            invoice_id=invoice.id,
            medicine_name=item.medicine_name,
            batch_number=item.batch_number,
            expiry_date=item.expiry_date,
            quantity=item.quantity,
            manufacturer=item.manufacturer,
            parsed_data=json.dumps(item.dict(), default=str)
        )
        db.add(inv_item)
        
        # Find or create medicine
        med = db.query(Medicine).filter(Medicine.name.ilike(item.medicine_name.strip())).first()
        if not med:
            med = Medicine(
                name=item.medicine_name.strip(),
                generic_name=item.generic_name or item.medicine_name.strip(),
                manufacturer=item.manufacturer or "Standard Pharma",
                category=item.category or "General",
                dosage=item.dosage or "500mg",
                form=item.form or "Tablet",
                min_temperature=item.min_temperature or 15.0,
                max_temperature=item.max_temperature or 25.0,
                min_humidity=item.min_humidity or 30.0,
                max_humidity=item.max_humidity or 65.0,
                reorder_level=item.reorder_level or 10
            )
            db.add(med)
            db.flush()
            
        # Check if batch already exists
        batch = db.query(Batch).filter(
            Batch.medicine_id == med.id,
            Batch.batch_number == item.batch_number.strip()
        ).first()
        
        if batch:
            batch.quantity_received += item.quantity
            batch.quantity_remaining += item.quantity
            batch.expiry_date = item.expiry_date
        else:
            batch = Batch(
                medicine_id=med.id,
                batch_number=item.batch_number.strip(),
                expiry_date=item.expiry_date,
                quantity_received=item.quantity,
                quantity_remaining=item.quantity,
                invoice_number=invoice.invoice_number,
                supplier_id=supplier.id,
                received_date=review_data.invoice_date
            )
            db.add(batch)
            db.flush()
            
        # Log RESTOCK transaction
        tx = Transaction(
            batch_id=batch.id,
            medicine_id=med.id,
            quantity=item.quantity,
            transaction_type="RESTOCK",
            notes=f"Stock received from Invoice #{invoice.invoice_number} ({supplier.name})"
        )
        db.add(tx)
        added_batches.append(batch)
        
    # Create success alert
    db.add(Alert(
        alert_type="STOCK",
        severity="INFO",
        message=f"Invoice #{invoice.invoice_number} verified and confirmed. {len(review_data.items)} batches added to inventory."
    ))
    
    db.commit()
    return invoice
