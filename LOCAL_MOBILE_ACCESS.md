# Access NounPaddi on Your Phone (Local Development)

This guide shows you how to access your locally running NounPaddi app on your phone.

## Prerequisites

- Your computer and phone must be on the **same WiFi network**
- Development servers running on your computer

## Step 1: Find Your Computer's Local IP Address

### On macOS:
```bash
# Option 1: Quick command
ipconfig getifaddr en0

# Option 2: Detailed info
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### On Windows:
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter

### On Linux:
```bash
hostname -I
# or
ip addr show
```

**Your IP will look like:** `192.168.1.XXX` or `10.0.0.XXX`

**Example:** Let's say your IP is `192.168.1.100`

## Step 2: Update Backend CORS Settings

Your backend is already configured! The CORS settings in `backend/server.js` allow connections from your local network.

Current allowed origins include:
- `http://localhost:3000`
- `http://localhost:3001`
- `http://192.168.108.10:3000`

## Step 3: Start Backend with Host Binding

Instead of just `npm start`, run:

```bash
cd backend
# For macOS/Linux
HOST=0.0.0.0 npm start

# For Windows (PowerShell)
$env:HOST="0.0.0.0"; npm start

# For Windows (CMD)
set HOST=0.0.0.0 && npm start
```

This makes the backend accessible from other devices on your network.

**Backend will be available at:**
- Local: `http://localhost:5001`
- Network: `http://YOUR_IP:5001`

## Step 4: Update Frontend Environment

1. Create a new environment file for local mobile access:

```bash
cd frontend
cp .env .env.local
```

2. Edit `frontend/.env.local`:

```bash
# Replace YOUR_IP with your actual IP address from Step 1
REACT_APP_API_URL=http://YOUR_IP:5001/api
```

**Example:**
```bash
REACT_APP_API_URL=http://192.168.1.100:5001/api
```

## Step 5: Start Frontend with Host Binding

```bash
cd frontend

# For macOS/Linux
HOST=0.0.0.0 npm start

# For Windows (PowerShell)
$env:HOST="0.0.0.0"; npm start

# For Windows (CMD)
set HOST=0.0.0.0 && npm start
```

**Frontend will be available at:**
- Local: `http://localhost:3000`
- Network: `http://YOUR_IP:3000`

## Step 6: Add IP to Backend CORS (If Needed)

If you get CORS errors, update `backend/server.js`:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://192.168.108.10:3000',
  'http://YOUR_IP:3000',  // Add your IP here
  process.env.FRONTEND_URL,
].filter(Boolean);
```

## Step 7: Access from Your Phone

1. **Make sure your phone is on the same WiFi as your computer**

2. **Open browser on your phone**

3. **Navigate to:**
   ```
   http://YOUR_IP:3000
   ```
   Example: `http://192.168.1.100:3000`

4. **The app should load!** 🎉

## Quick Start Script

Create a file `start-mobile.sh` in the root directory:

```bash
#!/bin/bash

# Get local IP
LOCAL_IP=$(ipconfig getifaddr en0)

echo "🌐 Your local IP: $LOCAL_IP"
echo ""
echo "📱 Access on phone: http://$LOCAL_IP:3000"
echo "🖥️  Backend API: http://$LOCAL_IP:5001"
echo ""
echo "Starting servers..."
echo ""

# Start backend
cd backend
HOST=0.0.0.0 npm start &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
cd ../frontend
HOST=0.0.0.0 REACT_APP_API_URL=http://$LOCAL_IP:5001/api npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Servers started!"
echo "📱 Open http://$LOCAL_IP:3000 on your phone"
echo ""
echo "Press Ctrl+C to stop both servers"

# Wait for Ctrl+C
wait
```

Make it executable:
```bash
chmod +x start-mobile.sh
```

Run it:
```bash
./start-mobile.sh
```

## Alternative: Use Package.json Scripts

### Backend package.json
Add this script:
```json
{
  "scripts": {
    "start": "node server.js",
    "start:mobile": "HOST=0.0.0.0 node server.js"
  }
}
```

### Frontend package.json
Add this script:
```json
{
  "scripts": {
    "start": "react-scripts start",
    "start:mobile": "HOST=0.0.0.0 react-scripts start"
  }
}
```

Then run:
```bash
# Terminal 1
cd backend
npm run start:mobile

# Terminal 2
cd frontend
npm run start:mobile
```

## Troubleshooting

### Issue: "Can't reach the server"

**Solution 1: Check Firewall**
- macOS: System Preferences → Security & Privacy → Firewall → Allow Node
- Windows: Allow Node.js through Windows Firewall
- Linux: Check iptables/ufw settings

**Solution 2: Verify same network**
```bash
# On computer, check IP
ipconfig getifaddr en0

# On phone, check WiFi settings
# Both should be on same network (e.g., 192.168.1.XXX)
```

### Issue: "CORS Error"

**Solution:** Add your IP to backend CORS origins:
```javascript
// backend/server.js
const allowedOrigins = [
  'http://localhost:3000',
  'http://YOUR_IP:3000',  // Add this
  process.env.FRONTEND_URL,
].filter(Boolean);
```

### Issue: "Connection Refused"

**Solution:** Make sure to use `HOST=0.0.0.0` when starting servers

### Issue: "Can access backend but not frontend"

**Solution:** Check if port 3000 is open in firewall

## Testing Checklist

- [ ] Computer and phone on same WiFi
- [ ] Backend started with HOST=0.0.0.0
- [ ] Frontend started with HOST=0.0.0.0
- [ ] REACT_APP_API_URL points to computer's IP
- [ ] Firewall allows connections
- [ ] Can access http://YOUR_IP:3000 on phone
- [ ] Can signup/login on phone
- [ ] All features work on phone

## Pro Tips

1. **Use HTTPS (Optional)**
   - Use tools like `ngrok` for secure tunneling
   - `npx ngrok http 3000`

2. **QR Code Access**
   - Generate QR code: `npx qrcode http://YOUR_IP:3000`
   - Scan with phone camera

3. **Dynamic IP Script**
   Create `get-ip.sh`:
   ```bash
   #!/bin/bash
   IP=$(ipconfig getifaddr en0)
   echo "📱 Frontend: http://$IP:3000"
   echo "🔌 Backend:  http://$IP:5001"
   ```

4. **Network Inspection**
   - Use browser dev tools on phone
   - Chrome: `chrome://inspect`
   - Safari: Enable Web Inspector in Settings

## Security Note

⚠️ **Warning:** This setup is for development only!
- Don't expose development servers to public internet
- Only use on trusted local networks
- Never commit `.env.local` with IP addresses

---

**Happy mobile testing! 📱**
