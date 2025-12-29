#!/bin/bash

# NounPaddi Mobile Access Script
# This script starts both servers accessible on your local network

echo "🚀 NounPaddi Mobile Access Setup"
echo "================================"
echo ""

# Get local IP address
LOCAL_IP=$(ipconfig getifaddr en0)

if [ -z "$LOCAL_IP" ]; then
    echo "❌ Could not detect local IP address"
    echo "Please check your network connection"
    exit 1
fi

echo "✅ Network detected!"
echo "🌐 Your local IP: $LOCAL_IP"
echo ""
echo "📱 Access from phone: http://$LOCAL_IP:3000"
echo "🖥️  Backend API: http://$LOCAL_IP:5001/api"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if backend exists
if [ ! -d "backend" ]; then
    echo "❌ Backend directory not found"
    exit 1
fi

# Check if frontend exists
if [ ! -d "frontend" ]; then
    echo "❌ Frontend directory not found"
    exit 1
fi

# Create or update frontend .env.local
echo "📝 Updating frontend configuration..."
cat > frontend/.env.local << EOF
REACT_APP_API_URL=http://$LOCAL_IP:5001/api
EOF

echo "✅ Configuration updated!"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT TERM

# Start backend
echo "🔧 Starting backend server..."
cd backend
HOST=0.0.0.0 PORT=5001 npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to initialize..."
sleep 5

# Check if backend started successfully
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Backend failed to start. Check backend.log for errors"
    exit 1
fi

echo "✅ Backend running on http://$LOCAL_IP:5001"
echo ""

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend
HOST=0.0.0.0 PORT=3000 npm start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to initialize..."
sleep 8

# Check if frontend started successfully
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo "❌ Frontend failed to start. Check frontend.log for errors"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Frontend running on http://$LOCAL_IP:3000"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 All servers started successfully.!"
echo ""
echo "📱 Mobile Access Instructions:"
echo "   1. Connect your phone to the same WiFi network"
echo "   2. Open browser on your phone"
echo "   3. Navigate to: http://$LOCAL_IP:3000"
echo ""
echo "💡 Tip: You can also create a QR code:"
echo "   npx qrcode http://$LOCAL_IP:3000"
echo ""
echo "📋 Server Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Press Ctrl+C to stop all servers"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Wait for Ctrl+C
wait
