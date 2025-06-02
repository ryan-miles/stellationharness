# 🚀 Infrastructure Visualizer - Startup Guide

## Quick Start (2 Steps)

### 1. Start the Backend API Server
```powershell
cd k:\Dev\stellationharness
node backend-server.js
```

### 2. Start the Frontend Development Server
```powershell
cd k:\Dev\stellationharness
npm start
```

Then open your browser to: `http://127.0.0.1:8080`

---

## Detailed Startup Instructions

### Prerequisites
- Node.js installed
- npm packages installed (`npm install` if not already done)

### Step-by-Step Startup

1. **Open PowerShell/Terminal**
   ```powershell
   cd k:\Dev\stellationharness
   ```

2. **Start Backend Server (Terminal 1)**
   ```powershell
   node backend-server.js
   ```
   
   ✅ **Success indicators:**
   - See: `🚀 Enhanced Multi-Cloud Backend API running on http://localhost:3001`
   - See: `🔑 Default admin API key created: sk_...`
   - See: `📡 AWS Instances Configured: X`

3. **Start Frontend Server (Terminal 2 - New Window)**
   ```powershell
   cd k:\Dev\stellationharness
   npm start
   ```
   
   ✅ **Success indicators:**
   - See: `Serving "src" at http://127.0.0.1:8080`
   - See: `Ready for changes`

4. **Open Browser**
   - Navigate to: `http://127.0.0.1:8080`
   - You should see the Infrastructure Visualizer with nodes displayed

---

## Important Notes

### API Key Management
- The backend generates a new API key each time it starts
- The frontend config (`src/js/config.js`) needs to match the backend key
- **If nodes don't load:** Check console for 401/403 errors and update the API key

### File Dependencies
- Ensure `cloud-utils.js` exists in both root and `src/` directories
- All required JS files must be in their proper locations

### Troubleshooting Common Issues

#### No Nodes Displayed
1. **Check Backend Connection**
   - Ensure backend is running on port 3001
   - Check console for connection errors

2. **API Key Mismatch**
   - Copy the new API key from backend startup logs
   - Update `src/js/config.js` with the new key

3. **Missing Files**
   - Verify `cloud-utils.js` is in `src/` directory
   - Check all JS files are loaded without 404 errors

#### Backend Won't Start
- Check for port conflicts (kill any process using port 3001)
- Verify all npm dependencies are installed

#### Frontend Won't Start
- Check for port conflicts (kill any process using port 8080)
- Ensure you're in the correct directory

---

## File Structure Requirements

```
stellationharness/
├── backend-server.js           ← Backend API server
├── cloud-utils.js             ← Shared utilities (root)
├── package.json               ← Dependencies
└── src/
    ├── cloud-utils.js         ← Copy of utilities (frontend)
    ├── index.html             ← Main visualizer page
    ├── management.html        ← Management interface
    └── js/
        ├── config.js          ← API configuration & keys
        ├── main.js            ← Main application logic
        ├── node.js            ← Node rendering
        ├── connection.js      ← Connection rendering
        ├── dragdrop.js        ← Drag & drop functionality
        └── aws-integration.js ← AWS integration
```

---

## Environment Setup (One-time)

If starting fresh or on a new machine:

```powershell
# Clone/download the project
cd k:\Dev\stellationharness

# Install dependencies
npm install

# Copy cloud utilities to frontend
Copy-Item "cloud-utils.js" "src/"

# Start as described above
```

---

## Development Tips

- **Live Reloading**: Frontend auto-reloads when you edit files
- **Backend Changes**: Restart backend server manually after changes
- **Debugging**: Check browser console for frontend errors
- **API Testing**: Backend logs all requests and responses

---

## Production Deployment Notes

For production deployment, you'll want to:
1. Set proper environment variables for API keys
2. Use a proper web server (nginx/Apache) instead of live-server
3. Configure proper CORS settings
4. Set up SSL/HTTPS
5. Use a process manager (PM2) for the backend

---

## Quick Reference Commands

```powershell
# Start everything (2 terminals needed)
Terminal 1: node backend-server.js
Terminal 2: npm start

# Check if ports are in use
netstat -an | findstr :3001
netstat -an | findstr :8080

# Kill processes on ports (if needed)
Get-Process -Id (Get-NetTCPConnection -LocalPort 3001).OwningProcess | Stop-Process
Get-Process -Id (Get-NetTCPConnection -LocalPort 8080).OwningProcess | Stop-Process
```

That's it! You should now have a fully functional infrastructure visualizer! 🎉
