import datetime
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Medicine, Batch, Transaction
from schemas import DemandPredictionItem

MINIMUM_SALES_RECORDS = 5

def predict_medicine_demand(db: Session, medicine_id: int) -> DemandPredictionItem:
    med = db.query(Medicine).filter(Medicine.id == medicine_id).first()
    if not med:
        raise ValueError(f"Medicine {medicine_id} not found")
        
    current_stock = db.query(func.coalesce(func.sum(Batch.quantity_remaining), 0)).filter(
        Batch.medicine_id == med.id
    ).scalar()
    
    # Query SALE transactions
    sales = db.query(Transaction).filter(
        Transaction.medicine_id == med.id,
        Transaction.transaction_type == "SALE"
    ).order_by(Transaction.created_at.asc()).all()
    
    if len(sales) < MINIMUM_SALES_RECORDS:
        return DemandPredictionItem(
            medicine_id=med.id,
            medicine_name=med.name,
            current_stock=int(current_stock),
            predicted_demand_30d=0.0,
            suggested_reorder_qty=max(0, med.reorder_level - int(current_stock)),
            model_status="INSUFFICIENT_DATA",
            message=f"Not enough historical sales data ({len(sales)}/{MINIMUM_SALES_RECORDS} records found)"
        )
        
    # Build time-series dataframe
    data = []
    base_time = sales[0].created_at
    for s in sales:
        days_diff = (s.created_at - base_time).total_seconds() / 86400.0
        data.append({"days": days_diff, "qty": s.quantity})
        
    df = pd.DataFrame(data)
    
    # Aggregate by day
    df_daily = df.groupby(df['days'].astype(int))['qty'].sum().reset_index()
    
    X = df_daily[['days']].values
    y = df_daily['qty'].values
    
    if len(X) < 2:
        avg_rate = df['qty'].sum() / max(1.0, (sales[-1].created_at - base_time).days or 1.0)
        pred_30d = avg_rate * 30.0
    else:
        model = LinearRegression()
        model.fit(X, y)
        # Average daily predicted sales over the next 30 days
        last_day = X[-1][0]
        future_days = np.arange(last_day + 1, last_day + 31).reshape(-1, 1)
        pred_daily = model.predict(future_days)
        pred_30d = float(np.sum(np.clip(pred_daily, 0, None)))
        if pred_30d <= 0:
            pred_30d = float(df['qty'].mean() * 30.0)
            
    suggested_reorder = max(0, int(round(pred_30d - current_stock)))
    
    return DemandPredictionItem(
        medicine_id=med.id,
        medicine_name=med.name,
        current_stock=int(current_stock),
        predicted_demand_30d=round(pred_30d, 1),
        suggested_reorder_qty=suggested_reorder,
        model_status="TRAINED",
        message="Model trained on historical sales transactions"
    )

def predict_all_demands(db: Session):
    medicines = db.query(Medicine).all()
    results = []
    for med in medicines:
        pred = predict_medicine_demand(db, med.id)
        results.append(pred)
    return results
