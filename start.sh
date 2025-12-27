#!/bin/bash

echo "🚀 Starting NounPaddi Application..."
echo ""

# Check if .env files exist
if [ ! -f backend/.env ]; then
    echo "⚠️  Backend .env file not found!"
    echo "Please copy backend/.env.example to backend/.env and configure it."
    exit 1
fi

if [ ! -f frontend/.env ]; then
    echo "⚠️  Frontend .env file not found!"
    echo "Creating frontend/.env with default values..."
    cp frontend/.env.example frontend/.env
fi

# Check if node_modules exist
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

echo ""
echo "✅ Starting servers..."
echo ""
echo "Backend will run on: http://localhost:5000"
echo "Frontend will run on: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start backend and frontend concurrently
cd backend && npm start &
BACKEND_PID=$!

cd frontend && npm start &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
