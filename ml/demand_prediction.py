#!/usr/bin/env python3
"""
Smart Pharmacy IoT System - ML Demand Prediction Module
Future expansion module for predicting medicine demand from historical sales.
Uses scikit-learn Linear Regression / Random Forest.
"""

import os
import sys
import datetime
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression

# Add backend to path for direct invocation
sys.path.append(os.path.join(os.path.dirname(__file__), "..", "backend"))

def run_demand_forecast():
    print("=" * 50)
    print("SMART PHARMACY - ML DEMAND PREDICTION MODULE")
    print("=" * 50)
    
    try:
        from database import SessionLocal
        from services.ml_service import predict_all_demands
        
        db = SessionLocal()
        try:
            predictions = predict_all_demands(db)
            print(f"\nAnalyzed {len(predictions)} medicines for demand forecasting:\n")
            print(f"{'Medicine':<25} | {'Stock':<6} | {'30d Demand':<12} | {'Suggested Reorder':<18} | {'Status':<15}")
            print("-" * 85)
            for p in predictions:
                print(f"{p.medicine_name:<25} | {p.current_stock:<6} | {p.predicted_demand_30d:<12} | {p.suggested_reorder_qty:<18} | {p.model_status:<15}")
                if p.model_status == "INSUFFICIENT_DATA":
                    print(f"   -> Note: {p.message}")
        finally:
            db.close()
    except Exception as e:
        print(f"Database connection error or uninitialized tables: {e}")
        print("Demonstrating offline mock training...")
        
        # Synthetic sales demo
        days = np.array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).reshape(-1, 1)
        sales = np.array([4, 6, 5, 8, 7, 10, 9, 12, 11, 14])
        reg = LinearRegression().fit(days, sales)
        future_days = np.array(range(11, 41)).reshape(-1, 1)
        pred_future = reg.predict(future_days)
        print(f"Linear Regression R² score: {reg.score(days, sales):.3f}")
        print(f"Predicted total 30-day demand: {np.sum(pred_future):.1f} units")

if __name__ == "__main__":
    run_demand_forecast()
