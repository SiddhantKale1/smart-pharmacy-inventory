from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import datetime
from database import get_db
from schemas import InventoryItemOut
from services.inventory_service import get_full_inventory, check_and_create_expiry_and_stock_alerts

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])

@router.get("", response_model=List[InventoryItemOut])
def get_inventory(
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    # Ensure alerts are up to date
    check_and_create_expiry_and_stock_alerts(db)
    
    items = get_full_inventory(db)
    
    if status:
        status_upper = status.upper().replace("-", " ")
        items = [i for i in items if i.inventory_status == status_upper]
        
    if search:
        s = search.lower()
        items = [
            i for i in items
            if s in i.medicine_name.lower() or
               (i.generic_name and s in i.generic_name.lower()) or
               s in i.batch_number.lower() or
               (i.rfid_uid and s in i.rfid_uid.lower())
        ]
        
    return items

@router.get("/low-stock", response_model=List[InventoryItemOut])
def get_low_stock_inventory(db: Session = Depends(get_db)):
    items = get_full_inventory(db)
    return [i for i in items if i.quantity_remaining <= i.reorder_level]

@router.get("/expiring", response_model=List[InventoryItemOut])
def get_expiring_inventory(db: Session = Depends(get_db)):
    items = get_full_inventory(db)
    return [i for i in items if 0 <= i.days_until_expiry <= 30]

@router.get("/expired", response_model=List[InventoryItemOut])
def get_expired_inventory(db: Session = Depends(get_db)):
    items = get_full_inventory(db)
    return [i for i in items if i.days_until_expiry < 0]
