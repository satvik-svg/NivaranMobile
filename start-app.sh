#!/bin/bash

echo "🚀 Starting Civic Report App"
echo "=========================="

# Function to check if a port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "✅ Port $1 is already in use"
        return 0
    else
        echo "❌ Port $1 is free"
        return 1
    fi
}

# Check and start backend
echo "🔧 Checking Backend (Port 1200)..."
if ! check_port 1200; then
    echo "🔧 Starting Backend..."
    cd backend && npm run dev &
    BACKEND_PID=$!
    echo "Backend started with PID: $BACKEND_PID"
    cd ..
fi

# Check and start AI service
echo "🤖 Checking AI Service (Port 8000)..."
if ! check_port 8000; then
    echo "🤖 Starting AI Service..."
    cd ai-service && uvicorn main:app --host 0.0.0.0 --port 8000 &
    AI_PID=$!
    echo "AI Service started with PID: $AI_PID"
    cd ..
fi

# Wait a moment for services to start
sleep 3

# Start Expo
echo "📱 Starting Expo Frontend..."
cd CivicReportApp
npx expo start

echo "🎉 All services started!"
echo "Backend: http://localhost:1200"
echo "AI Service: http://localhost:8000" 
echo "Frontend: Follow Expo instructions"