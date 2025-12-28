# 📱 Quick Mobile Access Guide

## Super Quick Start (macOS/Linux)

```bash
# 1. Make script executable (first time only)
chmod +x start-mobile.sh

# 2. Run the script
./start-mobile.sh

# 3. Open the URL shown on your phone
```

## Super Quick Start (Windows)

```bash
# Just double-click start-mobile.bat
# Or run from command prompt:
start-mobile.bat
```

## Manual Method (All Platforms)

### Step 1: Get Your IP
```bash
# macOS/Linux
ipconfig getifaddr en0

# Windows
ipconfig
```

### Step 2: Update Frontend Config
```bash
# Create frontend/.env.local with:
REACT_APP_API_URL=http://YOUR_IP:5000/api
```

### Step 3: Start Servers
```bash
# Terminal 1 - Backend
cd backend
HOST=0.0.0.0 npm start

# Terminal 2 - Frontend
cd frontend
HOST=0.0.0.0 npm start
```

### Step 4: Access on Phone
```
http://YOUR_IP:3000
```

## Requirements

✅ Computer and phone on **same WiFi**
✅ Firewall allows connections
✅ Ports 3000 and 5000 available

## Troubleshooting

**Can't connect?**
- Check same WiFi network
- Check firewall settings
- Verify servers are running

**CORS error?**
- Restart servers after updating .env.local
- Clear phone browser cache

---

📚 Full guide: [LOCAL_MOBILE_ACCESS.md](LOCAL_MOBILE_ACCESS.md)
