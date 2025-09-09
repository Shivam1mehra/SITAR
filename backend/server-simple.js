// Simplified SITAR Backend Server for MVP Demo
// This version works without external dependencies for quick testing

const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for MVP demo
let tourists = [];
let alerts = [];
let policeOfficers = [];
let geofences = [];

// Generate unique IDs
const generateId = () => 'SITAR_' + Math.random().toString(36).substr(2, 9).toUpperCase();

// Homepage route
app.get('/', (req, res) => {
  const acceptHeader = req.headers.accept || '';
  
  if (acceptHeader.includes('text/html')) {
    // Serve HTML for browsers
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SITAR - Smart Tourist Safety System</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1000px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .endpoint { background: #e8f4f8; padding: 10px; margin: 5px 0; border-radius: 5px; font-family: monospace; }
        .demo-btn { background: #28a745; color: white; border: none; padding: 10px 20px; margin: 5px; border-radius: 5px; cursor: pointer; }
        .demo-btn:hover { background: #218838; }
        .status { color: #28a745; font-weight: bold; }
        .emergency { color: #dc3545; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 SITAR</h1>
        <h2>Smart Tourist Safety Monitoring & Incident Response System</h2>
        <p>AI-powered tourist safety framework for Northeast India</p>
        <p class="status">✅ System Status: RUNNING</p>
    </div>

    <div class="card">
        <h3>🚀 Quick Demo</h3>
        <p>Test the SITAR API with these live demo buttons:</p>
        <button class="demo-btn" onclick="registerTourist()">Register Tourist</button>
        <button class="demo-btn emergency" onclick="triggerEmergency()">🚨 Trigger Emergency</button>
        <button class="demo-btn" onclick="getStats()">View Dashboard Stats</button>
        <button class="demo-btn" onclick="getAlerts()">View Alerts</button>
        <div id="result" style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 5px; display: none;"></div>
    </div>

    <div class="card">
        <h3>🔌 API Endpoints</h3>
        <div class="endpoint">GET  /health - Health check</div>
        <div class="endpoint">POST /api/auth/register - Register tourist/police</div>
        <div class="endpoint">POST /api/auth/login - User login</div>
        <div class="endpoint">POST /api/emergency/trigger - Emergency alerts</div>
        <div class="endpoint">GET  /api/analytics/dashboard-stats - Dashboard metrics</div>
        <div class="endpoint">GET  /api/alerts - List emergency alerts</div>
        <div class="endpoint">GET  /api/tourists - List registered tourists</div>
    </div>

    <div class="card">
        <h3>📡 Real-time Features</h3>
        <p><strong>WebSocket:</strong> ws://localhost:3000</p>
        <p><strong>Live Updates:</strong> Emergency alerts, location tracking, tourist status</p>
        <p><strong>Demo Data:</strong> Pre-loaded with sample tourists, police officers, and alerts</p>
    </div>

    <div class="card">
        <h3>🏆 Smart India Hackathon 2025</h3>
        <p><strong>Problem Statement:</strong> PS ID 25002 - Smart Tourist Safety Monitoring</p>
        <p><strong>Theme:</strong> Travel & Tourism (Northeast India)</p>
        <p><strong>Features:</strong> Blockchain Identity, AI Monitoring, Real-time Alerts, Police Dashboard</p>
    </div>

    <script>
        async function apiCall(url, method = 'GET', body = null) {
            try {
                const options = { method, headers: { 'Content-Type': 'application/json' } };
                if (body) options.body = JSON.stringify(body);
                
                const response = await fetch(url, options);
                const data = await response.json();
                
                document.getElementById('result').style.display = 'block';
                document.getElementById('result').innerHTML = '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
            } catch (error) {
                document.getElementById('result').innerHTML = '<p style="color: red;">Error: ' + error.message + '</p>';
            }
        }

        function registerTourist() {
            apiCall('/api/auth/register', 'POST', {
                name: 'Demo User',
                phone: '+919876543' + Math.floor(Math.random() * 1000),
                nationality: 'India',
                emergencyContacts: ['+919876543999']
            });
        }

        function triggerEmergency() {
            apiCall('/api/emergency/trigger', 'POST', {
                type: 'panic_button',
                description: 'Demo emergency alert - tourist needs help',
                severity: 'high'
            });
        }

        function getStats() {
            apiCall('/api/analytics/dashboard-stats');
        }

        function getAlerts() {
            apiCall('/api/alerts');
        }
    </script>
</body>
</html>
    `);
  } else {
    // Serve JSON for API clients
    res.json({
      name: 'SITAR - Smart Tourist Safety Monitoring System',
      version: '1.0.0',
      description: 'AI-powered tourist safety framework for Northeast India',
      status: 'running',
      endpoints: {
        health: '/health',
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        emergency: 'POST /api/emergency/trigger',
        stats: '/api/analytics/dashboard-stats',
        alerts: '/api/alerts',
        tourists: '/api/tourists'
      },
      demo: {
        'Register Tourist': 'POST /api/auth/register with {"name":"John","phone":"+919876543210","nationality":"India"}',
        'Trigger Emergency': 'POST /api/emergency/trigger with {"type":"panic_button","description":"Help needed"}',
        'View Stats': 'GET /api/analytics/dashboard-stats'
      },
      websocket: 'ws://localhost:3000 for real-time updates',
      timestamp: new Date().toISOString()
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'SITAR MVP Backend is running!',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// Tourist Registration
app.post('/api/auth/register', (req, res) => {
  const { name, phone, nationality, emergencyContacts, userType } = req.body;
  
  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  if (userType === 'police') {
    const officer = {
      id: generateId(),
      name,
      phone,
      badgeNumber: phone,
      stationName: 'Guwahati Police Station',
      createdAt: new Date().toISOString()
    };
    policeOfficers.push(officer);
    res.json({ success: true, user: officer, token: 'demo_token_police' });
  } else {
    const tourist = {
      id: generateId(),
      blockchainId: generateId(),
      name,
      phone,
      nationality: nationality || 'Unknown',
      emergencyContacts: emergencyContacts || [],
      isActive: true,
      createdAt: new Date().toISOString()
    };
    tourists.push(tourist);
    res.json({ success: true, user: tourist, token: 'demo_token_tourist' });
  }
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { phone, userType } = req.body;
  
  let user;
  if (userType === 'police') {
    user = policeOfficers.find(o => o.phone === phone);
  } else {
    user = tourists.find(t => t.phone === phone);
  }
  
  if (user) {
    res.json({ success: true, user, token: `demo_token_${userType}` });
  } else {
    res.status(401).json({ error: 'User not found' });
  }
});

// Emergency Alert
app.post('/api/emergency/trigger', (req, res) => {
  const { touristId, type, location, severity, description } = req.body;
  
  const alert = {
    id: generateId(),
    touristId: touristId || 'DEMO_TOURIST',
    type: type || 'panic_button',
    severity: severity || 'high',
    status: 'active',
    location: location || { latitude: 26.1445, longitude: 91.7362, address: 'Guwahati, Assam' },
    description: description || 'Emergency alert triggered',
    createdAt: new Date().toISOString()
  };
  
  alerts.push(alert);
  
  // Broadcast to all connected police dashboards
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'emergency_alert',
        data: alert
      }));
    }
  });
  
  res.json({ success: true, alert });
});

// Get Dashboard Stats
app.get('/api/analytics/dashboard-stats', (req, res) => {
  res.json({
    activeTourists: tourists.filter(t => t.isActive).length,
    activeAlerts: alerts.filter(a => a.status === 'active').length,
    responseTime: '2:34',
    resolvedIncidents: Math.floor(Math.random() * 10) + 5
  });
});

// Get Alerts
app.get('/api/alerts', (req, res) => {
  res.json(alerts.slice(-10)); // Return last 10 alerts
});

// Acknowledge Alert
app.post('/api/emergency/acknowledge', (req, res) => {
  const { alertId, officerId } = req.body;
  
  const alert = alerts.find(a => a.id === alertId);
  if (alert) {
    alert.status = 'acknowledged';
    alert.acknowledgedBy = officerId;
    alert.acknowledgedAt = new Date().toISOString();
    res.json({ success: true, alert });
  } else {
    res.status(404).json({ error: 'Alert not found' });
  }
});

// Location Update
app.post('/api/location/update', (req, res) => {
  const { touristId, latitude, longitude } = req.body;
  
  const tourist = tourists.find(t => t.id === touristId);
  if (tourist) {
    tourist.lastLocation = { latitude, longitude, timestamp: new Date().toISOString() };
  }
  
  res.json({ success: true });
});

// Get Tourists
app.get('/api/tourists', (req, res) => {
  res.json(tourists);
});

// Create demo data
const createDemoData = () => {
  // Add demo tourist
  tourists.push({
    id: 'DEMO_TOURIST_001',
    blockchainId: 'BLOCKCHAIN_DEMO_001',
    name: 'John Tourist',
    phone: '+919876543210',
    nationality: 'India',
    emergencyContacts: ['+919876543211'],
    isActive: true,
    lastLocation: { latitude: 26.1445, longitude: 91.7362, timestamp: new Date().toISOString() },
    createdAt: new Date().toISOString()
  });

  // Add demo police officer
  policeOfficers.push({
    id: 'DEMO_POLICE_001',
    name: 'Officer Smith',
    phone: '+919876543220',
    badgeNumber: 'GWH001',
    stationName: 'Guwahati Police Station',
    createdAt: new Date().toISOString()
  });

  // Add demo alert
  alerts.push({
    id: 'DEMO_ALERT_001',
    touristId: 'DEMO_TOURIST_001',
    type: 'panic_button',
    severity: 'high',
    status: 'active',
    location: { latitude: 26.1445, longitude: 91.7362, address: 'Fancy Bazaar, Guwahati' },
    description: 'Tourist pressed emergency button - needs immediate assistance',
    createdAt: new Date().toISOString()
  });

  console.log('✅ Demo data created');
};

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('📡 New WebSocket connection');
  
  ws.send(JSON.stringify({
    type: 'connection_established',
    message: 'Connected to SITAR Backend'
  }));
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 WebSocket message:', data.type);
      
      if (data.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong' }));
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('📡 WebSocket connection closed');
  });
});

// Simulate real-time updates
setInterval(() => {
  if (wss.clients.size > 0) {
    // Simulate location updates
    tourists.forEach(tourist => {
      if (tourist.lastLocation) {
        // Small random movement
        tourist.lastLocation.latitude += (Math.random() - 0.5) * 0.0001;
        tourist.lastLocation.longitude += (Math.random() - 0.5) * 0.0001;
        tourist.lastLocation.timestamp = new Date().toISOString();
      }
    });

    // Occasionally send updates to connected clients
    if (Math.random() < 0.3) { // 30% chance every 5 seconds
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({
            type: 'tourist_location_update',
            data: {
              activeTourists: tourists.filter(t => t.isActive).length,
              timestamp: new Date().toISOString()
            }
          }));
        }
      });
    }
  }
}, 5000);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log('\n🎯 SITAR MVP Backend Server Started!');
  console.log('=====================================');
  console.log(`🌐 Server: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log(`📡 WebSocket: ws://localhost:${PORT}`);
  console.log('=====================================');
  
  // Create demo data after server starts
  setTimeout(createDemoData, 1000);
});

module.exports = app;
