import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from services.seed_data import seed_database
from services.inventory_service import check_and_create_expiry_and_stock_alerts

# Import routers
from routes import (
    dashboard,
    medicines,
    batches,
    inventory,
    rfid,
    sensors,
    alerts,
    transactions,
    email_invoices,
    suppliers,
    thingspeak,
    ml,
    simulation
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("smart_pharma.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure database schema is created
    logger.info("Initializing database schema...")
    Base.metadata.create_all(bind=engine)
    
    # Auto-seed database with realistic demo dataset if empty
    db = SessionLocal()
    try:
        seed_database(db)
        check_and_create_expiry_and_stock_alerts(db)
    finally:
        db.close()
        
    logger.info("Smart Pharmacy IoT System API is ready!")
    yield
    # Shutdown logic if any
    logger.info("Shutting down API...")

app = FastAPI(
    title="Smart Pharmacy IoT System API",
    description="Full-stack IoT Pharmacy Inventory, Expiry Monitoring, and Climate Control Gateway",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS for React Vite frontend and local IoT development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(dashboard.router)
app.include_router(medicines.router)
app.include_router(batches.router)
app.include_router(inventory.router)
app.include_router(rfid.router)
app.include_router(sensors.router)
app.include_router(alerts.router)
app.include_router(transactions.router)
app.include_router(email_invoices.router)
app.include_router(suppliers.router)
app.include_router(thingspeak.router)
app.include_router(ml.router)
app.include_router(simulation.router)

@app.get("/")
def root():
    return {
        "system": "Smart Pharmacy IoT Inventory & Expiry Monitoring System",
        "status": "ONLINE",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/health")
def healthcheck():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host=host, port=port, reload=True)
