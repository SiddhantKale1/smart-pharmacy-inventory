#!/bin/bash
# ==============================================================================
# SMART PHARMACY IoT SYSTEM - UNIFIED LAUNCHER
# Starts FastAPI backend (port 8000) and React Vite frontend (port 5173)
# ==============================================================================

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

echo "======================================================================"
echo "        SMART PHARMACY IoT INVENTORY & EXPIRY MONITORING SYSTEM       "
echo "======================================================================"

# Find local IP address for ESP32 configuration
LOCAL_IP=$(hostname -I | awk '{print $1}')

# Cleanup background processes on exit
cleanup() {
    echo -e "\nShutting down Smart Pharmacy services..."
    if [ -n "$BACKEND_PID" ]; then
        kill "$BACKEND_PID" 2>/dev/null || true
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill "$FRONTEND_PID" 2>/dev/null || true
    fi
    echo "Services stopped cleanly."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Initialize Database
echo -e "\n[1/3] Initializing Database & Clinical Demo Dataset..."
cd "$BACKEND_DIR"
if [ ! -d "venv" ]; then
    echo "Creating Python virtualenv..."
    python3 -m venv venv
    ./venv/bin/pip install --upgrade pip
    ./venv/bin/pip install -r requirements.txt
fi

./venv/bin/python3 init_db.py

# 2. Launch FastAPI Backend
echo -e "\n[2/3] Launching FastAPI Backend on 0.0.0.0:8000..."
./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to be ready
echo "Waiting for API to bind..."
for i in {1..15}; do
    if curl -s http://127.0.0.1:8000/health > /dev/null; then
        echo "Backend is healthy and listening on port 8000!"
        break
    fi
    sleep 0.5
done

# 3. Launch React Vite Frontend
echo -e "\n[3/3] Launching React Vite Frontend on 0.0.0.0:5173..."
cd "$FRONTEND_DIR"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo -e "\n======================================================================"
echo " SYSTEM READY FOR USE & COLLEGE IoE PROJECT DEMONSTRATION!"
echo "======================================================================"
echo " 🌐 Web Dashboard:    http://localhost:5173"
echo " 📚 Swagger REST API: http://localhost:8000/docs"
echo " 🏥 Health Check:     http://localhost:8000/health"
echo " 📡 ESP32 Server URL: http://${LOCAL_IP:-localhost}:8000"
echo "======================================================================"
echo " Press [Ctrl+C] to stop all services."
echo ""

# Keep running until user stops
wait
