from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from database import get_db
from models import Medicine, Batch
from schemas import MedicineCreate, MedicineUpdate, MedicineOut

router = APIRouter(prefix="/api/medicines", tags=["Medicines"])

@router.get("", response_model=List[MedicineOut])
def get_medicines(
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Medicine)
    if search:
        term = f"%{search}%"
        query = query.filter(
            (Medicine.name.ilike(term)) |
            (Medicine.generic_name.ilike(term)) |
            (Medicine.manufacturer.ilike(term))
        )
    medicines = query.all()
    results = []
    for med in medicines:
        total_stock = db.query(func.coalesce(func.sum(Batch.quantity_remaining), 0)).filter(
            Batch.medicine_id == med.id
        ).scalar()
        out = MedicineOut.from_orm(med)
        out.total_stock = int(total_stock)
        results.append(out)
    return results

@router.get("/{id}", response_model=MedicineOut)
def get_medicine(id: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    total_stock = db.query(func.coalesce(func.sum(Batch.quantity_remaining), 0)).filter(
        Batch.medicine_id == med.id
    ).scalar()
    out = MedicineOut.from_orm(med)
    out.total_stock = int(total_stock)
    return out

@router.post("", response_model=MedicineOut)
def create_medicine(data: MedicineCreate, db: Session = Depends(get_db)):
    med = Medicine(**data.dict())
    db.add(med)
    db.commit()
    db.refresh(med)
    out = MedicineOut.from_orm(med)
    out.total_stock = 0
    return out

@router.put("/{id}", response_model=MedicineOut)
def update_medicine(id: int, data: MedicineUpdate, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    for key, value in data.dict(exclude_unset=True).items():
        setattr(med, key, value)
    db.commit()
    db.refresh(med)
    total_stock = db.query(func.coalesce(func.sum(Batch.quantity_remaining), 0)).filter(
        Batch.medicine_id == med.id
    ).scalar()
    out = MedicineOut.from_orm(med)
    out.total_stock = int(total_stock)
    return out

@router.delete("/{id}")
def delete_medicine(id: int, db: Session = Depends(get_db)):
    med = db.query(Medicine).filter(Medicine.id == id).first()
    if not med:
        raise HTTPException(status_code=404, detail="Medicine not found")
    db.delete(med)
    db.commit()
    return {"message": f"Medicine '{med.name}' deleted successfully"}
