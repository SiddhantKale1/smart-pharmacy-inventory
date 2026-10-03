from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
import json
from database import get_db
from models import EmailImport, Invoice, InvoiceItem, Supplier
from schemas import (
    EmailImportOut, InvoiceOut, InvoiceReviewConfirmRequest
)
from services.email_service import (
    fetch_and_stage_supplier_emails,
    confirm_and_import_invoice,
    parse_csv_invoice,
    stage_invoice
)

router = APIRouter(prefix="", tags=["Email & Invoices"])

@router.post("/api/email/import")
def trigger_email_import(db: Session = Depends(get_db)):
    """Fetches supplier emails, parses invoices, and stages them for verification"""
    staged = fetch_and_stage_supplier_emails(db)
    return {
        "success": True,
        "message": f"Processed emails. {len(staged)} invoice(s) staged for pharmacist review.",
        "staged_invoices": [inv.invoice_number for inv in staged]
    }

@router.get("/api/email/imports", response_model=List[EmailImportOut])
def get_email_imports(db: Session = Depends(get_db)):
    imports = db.query(EmailImport).order_by(desc(EmailImport.received_at)).all()
    return imports

@router.get("/api/invoices", response_model=List[InvoiceOut])
def get_invoices(db: Session = Depends(get_db)):
    invoices = db.query(Invoice).order_by(desc(Invoice.created_at)).all()
    results = []
    for inv in invoices:
        out = InvoiceOut.from_orm(inv)
        if inv.supplier:
            out.supplier_name = inv.supplier.name
        out.item_count = len(inv.items)
        results.append(out)
    return results

@router.get("/api/invoices/{id}")
def get_invoice_details(id: int, db: Session = Depends(get_db)):
    inv = db.query(Invoice).filter(Invoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Invoice not found")
        
    items = []
    for item in inv.items:
        parsed_extra = {}
        if item.parsed_data:
            try:
                parsed_extra = json.loads(item.parsed_data)
            except Exception:
                pass
        items.append({
            "id": item.id,
            "medicine_name": item.medicine_name,
            "generic_name": parsed_extra.get("generic_name", item.medicine_name),
            "batch_number": item.batch_number,
            "expiry_date": str(item.expiry_date),
            "quantity": item.quantity,
            "manufacturer": item.manufacturer,
            "dosage": parsed_extra.get("dosage", "500mg"),
            "form": parsed_extra.get("form", "Tablet"),
            "min_temperature": parsed_extra.get("min_temperature", 15.0),
            "max_temperature": parsed_extra.get("max_temperature", 25.0),
            "min_humidity": parsed_extra.get("min_humidity", 30.0),
            "max_humidity": parsed_extra.get("max_humidity", 65.0),
            "reorder_level": parsed_extra.get("reorder_level", 10)
        })
        
    return {
        "id": inv.id,
        "invoice_number": inv.invoice_number,
        "supplier_name": inv.supplier.name if inv.supplier else "MedSupply Global",
        "invoice_date": str(inv.invoice_date),
        "import_status": inv.import_status,
        "created_at": inv.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "items": items
    }

@router.post("/api/invoices/import")
async def import_invoice_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload CSV or text invoice as a fallback when email is not used"""
    content = await file.read()
    text = content.decode("utf-8", errors="ignore")
    
    parsed = parse_csv_invoice(text)
    invoice = stage_invoice(
        db,
        parsed,
        sender="manual_upload@pharmacy.local",
        subject=f"Manual Upload: {file.filename}",
        raw_body=text[:1000]
    )
    return {
        "success": True,
        "message": f"Invoice #{invoice.invoice_number} staged for verification from uploaded file.",
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number
    }

@router.post("/api/invoices/{id}/confirm")
def confirm_invoice(id: int, data: InvoiceReviewConfirmRequest, db: Session = Depends(get_db)):
    """
    Pharmacy staff confirms and commits reviewed invoice data to PostgreSQL.
    Creates/updates medicines & batches and increases inventory.
    """
    try:
        inv = confirm_and_import_invoice(db, id, data)
        return {
            "success": True,
            "message": f"Invoice #{inv.invoice_number} confirmed and inventory updated successfully.",
            "invoice_id": inv.id,
            "status": inv.import_status
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
