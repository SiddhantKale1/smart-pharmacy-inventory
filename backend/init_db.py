#!/usr/bin/env python3
"""
Database Initializer and Seeder Script
Reads connection settings from backend/.env and sets up tables and clinical dataset.
"""

import sys
import os
from database import engine, Base, SessionLocal
from services.seed_data import seed_database
from services.inventory_service import check_and_create_expiry_and_stock_alerts

def main():
    print("=" * 60)
    print("SMART PHARMACY IoT - DATABASE INITIALIZER")
    print("=" * 60)
    print(f"Connecting to database engine: {engine.url}")
    
    print("Creating schema tables (users, suppliers, medicines, batches, rfid_tags, transactions, sensor_readings, alerts, email_imports, invoices, invoice_items)...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")
    
    db = SessionLocal()
    try:
        print("Checking clinical demo data...")
        seed_database(db)
        print("Evaluating initial expiry dates and low stock alerts...")
        check_and_create_expiry_and_stock_alerts(db)
        print("Database is fully initialized and ready for production or college demonstration!")
    except Exception as e:
        print(f"Error during seeding: {e}")
        sys.exit(1)
    finally:
        db.close()

if __name__ == "__main__":
    main()
