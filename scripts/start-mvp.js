#!/usr/bin/env node

/**
 * SITAR MVP Demonstration Script
 * This script creates a working MVP demonstration without requiring full infrastructure setup
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Simple in-memory data store for MVP demonstration
const mockData = {
  tourists: [
    {
      id: 'tourist-001',
      name: 'Priya Sharma',
      nationality: 'India',
      phoneNumber: '+91-9876543210',
      did: 'did:sitar:tourist:sample123',
      safetyScore: 92.5,
      status: 'active',
      currentLocation: { lat: 25.2744, lng: 91.8789 }, // Guwahati
      emergencyContacts: [
        { name: 'Rajesh Sharma', relationship: 'Father', phone: '+91-9876543211' }
      ]
    },
    {
      id: 'tourist-002', 
      name: 'David Johnson',
      nationality: 'USA',
      phoneNumber: '+1-555-0123',
      did: 'did:sitar:tourist:sample124',
      safetyScore: 88.3,
      status: 'active',
      currentLocation: { lat: 26.1445, lng: 91.7362 }, // Kaziranga
      emergencyContacts: [
        { name: 'Sarah Johnson', relationship: 'Wife', phone: '+1-555-0124' }
      ]
    },
    {
      id: 'tourist-003',
      name: 'Chen Wei',
      nationality: 'China',
      phoneNumber: '+86-138-0013-8000',
      did: 'did:sitar:tourist:sample125',
      safetyScore: 95.1,
      status: 'active', 
      currentLocation: { lat: 24.6637, lng: 93.9063 }, // Imphal
      emergencyContacts: [
        { name: 'Li Ming', relationship: 'Brother', phone: '+86-138-0013-8001' }
      ]
    }
  ],
  alerts: [
    {
      id: 'alert-001',
      touristId: 'tourist-001',
      type: 'geofence_breach',
      severity: 'medium',
      status: 'resolved',
      title: 'Tourist entered restricted area',
      message: 'Tourist Priya Sharma entered a restricted forest zone near Kaziranga',
      location: { lat: 26.1445, lng: 91.7362 },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'alert-002',
      touristId: 'tourist-002',
      type: 'route_deviation',
      severity: 'low',
      status: 'open',
      title: 'Tourist deviated from planned route',
      message: 'Tourist David Johnson deviated from planned itinerary',
      location: { lat: 26.1445, lng: 91.7362 },
      createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
    }
  ],
  geofences: [
    {
      id: 'geofence-001',
      name: 'Kaziranga Safe Zone',
      type: 'safe_zone',
      riskLevel: 'low',
      geometry: {
        type: 'circle',
        center: { lat: 26.5775, lng: 93.1742 },
        radius: 5000 // 5km
      }
    },
    {
      id: 'geofence-002', 
      name: 'Restricted Forest Area',
      type: 'restricted_zone',
      riskLevel: 'high',
      geometry: {
        type: 'polygon',
        coordinates: [
          { lat: 26.1445, lng: 91.7362 },
          { lat: 26.1545, lng: 91.7462 },
          { lat: 26.1345, lng: 91.7562 },
          { lat: 26.1245, lng: 91.7262 }
        ]
      }
    }
  ],
  policeUnits: [
    {
      id: 'unit-001',
      name: 'Tourist Police Unit Alpha',
      type: 'tourist_police',
      status: 'available',
      location: { lat: 26.1445, lng: 91.7362 },
      officers: ['Officer Ravi Kumar', 'Officer Meera Devi'],
      contactNumber: '+91-3612-123456'
    },
    {
      id: 'unit-002',
      name: 'Emergency Response Team',
      type: 'emergency',
      status: 'on_duty',
      location: { lat: 25.2744, lng: 91.8789 },
      officers: ['Inspector Bhaskar Das', 'Constable Anita Sharma'],
      contactNumber: '+91-361-100'
    }
  ]
};

class SitarMVPServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    this.port = process.env.PORT || 3000;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupMockUpdates();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'sitar-mvp-demo',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API Info
    this.app.get('/api/v1', (req, res) => {
      res.json({
        name: 'SITAR MVP Demo API',
        version: '1.0.0',
        description: 'Smart Integrated Tourist Assistance & Response System - MVP Demo',
        features: [
          'Real-time tourist tracking',
          'Emergency SOS system', 
          'Geofence monitoring',
          'AI-powered anomaly detection',
          'Blockchain digital identity',
          'Multi-language support',
          'Police dispatch system'
        ],
        endpoints: {
          dashboard: '/dashboard',
          tourists: '/api/v1/tourists',
          alerts: '/api/v1/alerts',
          geofences: '/api/v1/geofences',
          police: '/api/v1/police',
          sos: '/api/v1/sos'
        }
      });
    });

    // Dashboard endpoint
    this.app.get('/dashboard', (req, res) => {
      res.json({
        success: true,
        data: {
          overview: {
            totalTourists: mockData.tourists.length,
            activeTourists: mockData.tourists.filter(t => t.status === 'active').length,
            totalAlerts: mockData.alerts.length,
            openAlerts: mockData.alerts.filter(a => a.status === 'open').length,
            averageSafetyScore: mockData.tourists.reduce((sum, t) => sum + t.safetyScore, 0) / mockData.tourists.length
          },
          recentAlerts: mockData.alerts.slice(-5),
          touristStats: mockData.tourists.map(t => ({
            id: t.id,
            name: t.name,
            safetyScore: t.safetyScore,
            status: t.status,
            location: t.currentLocation
          }))
        }
      });
    });

    // Tourist endpoints
    this.app.get('/api/v1/tourists', (req, res) => {
      res.json({
        success: true,
        data: mockData.tourists
      });
    });

    this.app.get('/api/v1/tourists/:id', (req, res) => {
      const tourist = mockData.tourists.find(t => t.id === req.params.id);
      if (!tourist) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Tourist not found' }
        });
      }
      res.json({ success: true, data: tourist });
    });

    // Alert endpoints
    this.app.get('/api/v1/alerts', (req, res) => {
      res.json({
        success: true,
        data: mockData.alerts
      });
    });

    // SOS Emergency endpoint
    this.app.post('/api/v1/sos', (req, res) => {
      const { touristId, message, location } = req.body;
      
      const tourist = mockData.tourists.find(t => t.id === touristId);
      if (!tourist) {
        return res.status(404).json({
          success: false,
          error: { code: 'TOURIST_NOT_FOUND', message: 'Tourist not found' }
        });
      }

      const alert = {
        id: `alert-${Date.now()}`,
        touristId,
        type: 'panic_button',
        severity: 'critical',
        status: 'open',
        title: 'EMERGENCY SOS ALERT',
        message: message || `${tourist.name} has activated the emergency SOS button`,
        location: location || tourist.currentLocation,
        createdAt: new Date().toISOString(),
        touristName: tourist.name,
        touristPhone: tourist.phoneNumber
      };

      mockData.alerts.unshift(alert);

      // Broadcast to WebSocket clients
      this.io.emit('emergency_alert', {
        type: 'emergency_alert',
        data: alert
      });

      // Simulate police dispatch
      setTimeout(() => {
        const nearestUnit = mockData.policeUnits[0];
        this.io.emit('police_dispatched', {
          type: 'police_dispatched', 
          data: {
            alertId: alert.id,
            unit: nearestUnit,
            estimatedArrival: '8 minutes'
          }
        });
      }, 2000);

      res.status(201).json({
        success: true,
        data: alert,
        message: '🚨 EMERGENCY ALERT ACTIVATED! Police units have been dispatched to your location. Stay calm, help is on the way!'
      });
    });

    // Geofence endpoints
    this.app.get('/api/v1/geofences', (req, res) => {
      res.json({
        success: true,
        data: mockData.geofences
      });
    });

    // Police endpoints
    this.app.get('/api/v1/police', (req, res) => {
      res.json({
        success: true, 
        data: mockData.policeUnits
      });
    });

    // Analytics endpoint
    this.app.get('/api/v1/analytics', (req, res) => {
      res.json({
        success: true,
        data: {
          touristAnalytics: {
            totalTourists: mockData.tourists.length,
            byNationality: {
              'India': 1,
              'USA': 1,
              'China': 1
            },
            averageSafetyScore: 91.97
          },
          alertAnalytics: {
            totalAlerts: mockData.alerts.length,
            byType: {
              'geofence_breach': 1,
              'route_deviation': 1
            },
            bySeverity: {
              'low': 1,
              'medium': 1,
              'high': 0,
              'critical': 0
            },
            averageResponseTime: '4.2 minutes'
          },
          geofenceAnalytics: {
            totalGeofences: mockData.geofences.length,
            byType: {
              'safe_zone': 1,
              'restricted_zone': 1
            }
          }
        }
      });
    });

    // Mock blockchain endpoints
    this.app.get('/api/v1/blockchain/identities', (req, res) => {
      res.json({
        success: true,
        data: mockData.tourists.map(t => ({
          did: t.did,
          subject: t.id,
          issuer: 'did:sitar:authority:tourism-dept',
          issuanceDate: '2024-01-01T00:00:00Z',
          expirationDate: '2024-12-31T23:59:59Z',
          revoked: false
        }))
      });
    });

    // Serve demo dashboard
    this.app.get('/', (req, res) => {
      res.send(this.getDashboardHTML());
    });
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      socket.emit('system_status', {
        status: 'connected',
        activeTourists: mockData.tourists.filter(t => t.status === 'active').length,
        openAlerts: mockData.alerts.filter(a => a.status === 'open').length
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });

      // Handle tourist location updates
      socket.on('location_update', (data) => {
        const tourist = mockData.tourists.find(t => t.id === data.touristId);
        if (tourist) {
          tourist.currentLocation = data.location;
          tourist.safetyScore = Math.max(50, Math.min(100, tourist.safetyScore + (Math.random() - 0.5) * 2));
          
          this.io.emit('location_update', {
            touristId: data.touristId,
            location: data.location,
            safetyScore: tourist.safetyScore,
            timestamp: new Date().toISOString()
          });
        }
      });
    });
  }

  setupMockUpdates() {
    // Simulate real-time updates every 30 seconds
    setInterval(() => {
      // Update tourist safety scores
      mockData.tourists.forEach(tourist => {
        const oldScore = tourist.safetyScore;
        tourist.safetyScore = Math.max(60, Math.min(100, oldScore + (Math.random() - 0.5) * 3));
        
        // Simulate minor location changes
        tourist.currentLocation.lat += (Math.random() - 0.5) * 0.01;
        tourist.currentLocation.lng += (Math.random() - 0.5) * 0.01;
      });

      // Broadcast updates
      this.io.emit('safety_scores_update', {
        timestamp: new Date().toISOString(),
        scores: mockData.tourists.map(t => ({
          touristId: t.id,
          safetyScore: t.safetyScore,
          location: t.currentLocation
        }))
      });
    }, 30000);

    // Simulate occasional alerts
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every minute
        const alertTypes = ['route_deviation', 'geofence_breach', 'prolonged_inactivity'];
        const severities = ['low', 'medium'];
        const randomTourist = mockData.tourists[Math.floor(Math.random() * mockData.tourists.length)];
        
        const alert = {
          id: `alert-${Date.now()}`,
          touristId: randomTourist.id,
          type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          status: 'open',
          title: 'Automated Alert',
          message: `Automated alert detected for ${randomTourist.name}`,
          location: randomTourist.currentLocation,
          createdAt: new Date().toISOString()
        };

        mockData.alerts.unshift(alert);
        if (mockData.alerts.length > 10) mockData.alerts.pop();

        this.io.emit('new_alert', {
          type: 'new_alert',
          data: alert
        });
      }
    }, 60000);
  }

  getDashboardHTML() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SITAR - Smart Tourist Safety System</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: #333;
                min-height: 100vh;
                padding: 20px;
            }
            .container {
                max-width: 1200px;
                margin: 0 auto;
                background: rgba(255,255,255,0.95);
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #4CAF50, #45a049);
                color: white;
                padding: 30px;
                text-align: center;
            }
            .header h1 {
                font-size: 2.5em;
                margin-bottom: 10px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 20px;
                padding: 30px;
                background: #f8f9fa;
            }
            .stat-card {
                background: white;
                padding: 25px;
                border-radius: 15px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                text-align: center;
                transition: transform 0.3s ease;
            }
            .stat-card:hover {
                transform: translateY(-5px);
            }
            .stat-value {
                font-size: 2.5em;
                font-weight: bold;
                color: #4CAF50;
                margin-bottom: 10px;
            }
            .stat-label {
                color: #666;
                text-transform: uppercase;
                letter-spacing: 1px;
                font-size: 0.9em;
            }
            .alerts-section {
                padding: 30px;
            }
            .section-title {
                font-size: 1.8em;
                margin-bottom: 20px;
                color: #333;
                border-bottom: 3px solid #4CAF50;
                padding-bottom: 10px;
            }
            .alert-item {
                background: white;
                margin: 15px 0;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                border-left: 5px solid #ff9800;
                transition: all 0.3s ease;
            }
            .alert-item.critical {
                border-left-color: #f44336;
                animation: pulse 2s infinite;
            }
            .alert-item.high {
                border-left-color: #ff5722;
            }
            .alert-item.medium {
                border-left-color: #ff9800;
            }
            .alert-item.low {
                border-left-color: #2196F3;
            }
            @keyframes pulse {
                0% { box-shadow: 0 5px 15px rgba(244, 67, 54, 0.1); }
                50% { box-shadow: 0 5px 25px rgba(244, 67, 54, 0.3); }
                100% { box-shadow: 0 5px 15px rgba(244, 67, 54, 0.1); }
            }
            .sos-button {
                position: fixed;
                bottom: 30px;
                right: 30px;
                background: #f44336;
                color: white;
                border: none;
                border-radius: 50%;
                width: 80px;
                height: 80px;
                font-size: 1.2em;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(244, 67, 54, 0.4);
                transition: all 0.3s ease;
                z-index: 1000;
            }
            .sos-button:hover {
                transform: scale(1.1);
                box-shadow: 0 15px 40px rgba(244, 67, 54, 0.6);
            }
            .status-indicator {
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.8em;
                font-weight: bold;
                text-transform: uppercase;
            }
            .status-open {
                background: #ffebee;
                color: #c62828;
            }
            .status-resolved {
                background: #e8f5e8;
                color: #2e7d32;
            }
            .connection-status {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                border-radius: 25px;
                background: #4CAF50;
                color: white;
                font-weight: bold;
                z-index: 1000;
            }
        </style>
    </head>
    <body>
        <div class="connection-status" id="connectionStatus">
            🔴 Connecting...
        </div>

        <div class="container">
            <div class="header">
                <h1>🛡️ SITAR</h1>
                <p>Smart Integrated Tourist Assistance & Response System</p>
                <p>Real-time Tourist Safety Monitoring & Emergency Response</p>
            </div>

            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value" id="totalTourists">0</div>
                    <div class="stat-label">Total Tourists</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="activeTourists">0</div>
                    <div class="stat-label">Active Now</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalAlerts">0</div>
                    <div class="stat-label">Total Alerts</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="avgSafety">0%</div>
                    <div class="stat-label">Avg Safety Score</div>
                </div>
            </div>

            <div class="alerts-section">
                <h2 class="section-title">🚨 Recent Alerts & Incidents</h2>
                <div id="alertsList">
                    <!-- Alerts will be loaded here -->
                </div>
            </div>
        </div>

        <button class="sos-button" onclick="triggerSOS()" title="Emergency SOS">
            SOS
        </button>

        <script>
            const socket = io();
            let dashboardData = {};

            // Connection status
            socket.on('connect', () => {
                document.getElementById('connectionStatus').innerHTML = '🟢 Connected';
                document.getElementById('connectionStatus').style.background = '#4CAF50';
                loadDashboardData();
            });

            socket.on('disconnect', () => {
                document.getElementById('connectionStatus').innerHTML = '🔴 Disconnected';
                document.getElementById('connectionStatus').style.background = '#f44336';
            });

            // Load initial dashboard data
            async function loadDashboardData() {
                try {
                    const response = await fetch('/dashboard');
                    const result = await response.json();
                    dashboardData = result.data;
                    updateDashboard();
                } catch (error) {
                    console.error('Failed to load dashboard data:', error);
                }
            }

            function updateDashboard() {
                if (!dashboardData.overview) return;

                document.getElementById('totalTourists').textContent = dashboardData.overview.totalTourists;
                document.getElementById('activeTourists').textContent = dashboardData.overview.activeTourists;
                document.getElementById('totalAlerts').textContent = dashboardData.overview.totalAlerts;
                document.getElementById('avgSafety').textContent = Math.round(dashboardData.overview.averageSafetyScore) + '%';

                // Update alerts list
                const alertsList = document.getElementById('alertsList');
                alertsList.innerHTML = dashboardData.recentAlerts.map(alert => \`
                    <div class="alert-item \${alert.severity}">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                            <strong>\${alert.title}</strong>
                            <span class="status-indicator status-\${alert.status}">\${alert.status}</span>
                        </div>
                        <p>\${alert.message}</p>
                        <small>📍 \${alert.location?.lat?.toFixed(4)}, \${alert.location?.lng?.toFixed(4)} | 
                               ⏰ \${new Date(alert.createdAt).toLocaleString()}</small>
                    </div>
                \`).join('');
            }

            // Real-time updates
            socket.on('new_alert', (data) => {
                dashboardData.recentAlerts.unshift(data.data);
                dashboardData.overview.totalAlerts++;
                updateDashboard();
                
                // Show notification
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification('🚨 New Alert', {
                        body: data.data.message,
                        icon: '/favicon.ico'
                    });
                }
            });

            socket.on('emergency_alert', (data) => {
                alert('🚨 EMERGENCY ALERT!\\n\\n' + data.data.message + '\\n\\nPolice units are being dispatched!');
                dashboardData.recentAlerts.unshift(data.data);
                updateDashboard();
            });

            socket.on('police_dispatched', (data) => {
                alert('🚔 Police Dispatched!\\n\\nUnit: ' + data.data.unit.name + '\\nETA: ' + data.data.estimatedArrival);
            });

            socket.on('safety_scores_update', (data) => {
                // Update safety scores in real-time
                console.log('Safety scores updated:', data);
            });

            // SOS Function
            function triggerSOS() {
                if (confirm('🚨 ACTIVATE EMERGENCY SOS?\\n\\nThis will immediately alert police and emergency services to your location.')) {
                    const sosData = {
                        touristId: 'tourist-001', // Demo tourist
                        message: 'Emergency SOS activated from dashboard demo',
                        location: { lat: 26.1445, lng: 91.7362 }
                    };

                    fetch('/api/v1/sos', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(sosData)
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            alert('✅ ' + result.message);
                        } else {
                            alert('❌ Failed to send SOS: ' + result.error.message);
                        }
                    })
                    .catch(error => {
                        alert('❌ Error sending SOS: ' + error.message);
                    });
                }
            }

            // Request notification permission
            if ('Notification' in window && Notification.permission !== 'granted') {
                Notification.requestPermission();
            }

            // Auto-refresh data every 30 seconds
            setInterval(loadDashboardData, 30000);
        </script>
    </body>
    </html>
    `;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log('\n🌟 ===============================================');
      console.log('🚀 SITAR MVP Demo Server is running!');
      console.log('===============================================');
      console.log(`📊 Dashboard: http://localhost:${this.port}`);
      console.log(`📡 API Docs: http://localhost:${this.port}/api/v1`);
      console.log(`🔧 Health: http://localhost:${this.port}/health`);
      console.log('===============================================\n');
      console.log('🎯 Features Demonstrated:');
      console.log('   ✅ Real-time tourist tracking');
      console.log('   ✅ Emergency SOS system');
      console.log('   ✅ Geofence monitoring');
      console.log('   ✅ Alert management');
      console.log('   ✅ Police dispatch');
      console.log('   ✅ Live dashboard');
      console.log('   ✅ WebSocket real-time updates');
      console.log('\n🔴 Click the SOS button for emergency demo!');
      console.log('===============================================\n');
    });
  }
}

// Start the MVP server
const server = new SitarMVPServer();
server.start();
