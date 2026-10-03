from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from schemas import DemandPredictionItem
from services.ml_service import predict_all_demands, predict_medicine_demand

router = APIRouter(prefix="/api/ml", tags=["Machine Learning"])

@router.get("/demand-prediction", response_model=List[DemandPredictionItem])
def get_demand_predictions(db: Session = Depends(get_db)):
    """Runs scikit-learn regression on historical sales transactions to predict 30-day demand"""
    return predict_all_demands(db)

@router.get("/demand-prediction/{medicine_id}", response_model=DemandPredictionItem)
def get_single_medicine_prediction(medicine_id: int, db: Session = Depends(get_db)):
    return predict_medicine_demand(db, medicine_id)
