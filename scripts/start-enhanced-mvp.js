#!/usr/bin/env node

/**
 * SITAR Enhanced MVP with Separate Apps & AI Analytics
 * - Tourist Mobile App Interface
 * - Police Dashboard 
 * - Admin Control Panel
 * - AI Analytics Board with Location Safety Prediction
 */

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

// Enhanced mock data with AI predictions
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
      currentLocation: { lat: 25.2744, lng: 91.8789, name: 'Guwahati City Center' },
      plannedRoute: [
        { lat: 25.2744, lng: 91.8789, name: 'Guwahati City Center', eta: '2024-01-10T10:00:00Z' },
        { lat: 26.1445, lng: 91.7362, name: 'Kaziranga National Park', eta: '2024-01-10T14:00:00Z' }
      ],
      emergencyContacts: [
        { name: 'Rajesh Sharma', relationship: 'Father', phone: '+91-9876543211' }
      ],
      preferences: {
        language: 'hi',
        notifications: true,
        tracking: true
      }
    },
    {
      id: 'tourist-002', 
      name: 'David Johnson',
      nationality: 'USA',
      phoneNumber: '+1-555-0123',
      did: 'did:sitar:tourist:sample124',
      safetyScore: 88.3,
      status: 'active',
      currentLocation: { lat: 26.1445, lng: 91.7362, name: 'Kaziranga National Park' },
      plannedRoute: [
        { lat: 26.1445, lng: 91.7362, name: 'Kaziranga National Park', eta: '2024-01-10T12:00:00Z' },
        { lat: 26.7505, lng: 94.2026, name: 'Majuli Island', eta: '2024-01-10T16:00:00Z' }
      ],
      emergencyContacts: [
        { name: 'Sarah Johnson', relationship: 'Wife', phone: '+1-555-0124' }
      ],
      preferences: {
        language: 'en',
        notifications: true,
        tracking: true
      }
    },
    {
      id: 'tourist-003',
      name: 'Chen Wei',
      nationality: 'China',
      phoneNumber: '+86-138-0013-8000',
      did: 'did:sitar:tourist:sample125',
      safetyScore: 95.1,
      status: 'active', 
      currentLocation: { lat: 24.6637, lng: 93.9063, name: 'Imphal City' },
      plannedRoute: [
        { lat: 24.6637, lng: 93.9063, name: 'Imphal City', eta: '2024-01-10T11:00:00Z' },
        { lat: 24.8112, lng: 93.9446, name: 'Kangla Fort', eta: '2024-01-10T15:00:00Z' }
      ],
      emergencyContacts: [
        { name: 'Li Ming', relationship: 'Brother', phone: '+86-138-0013-8001' }
      ],
      preferences: {
        language: 'en',
        notifications: true,
        tracking: true
      }
    }
  ],
  
  // AI Location Safety Database
  locationSafety: {
    'Guwahati City Center': { 
      score: 85, risk: 'low', factors: ['well-lit', 'police-presence', 'tourist-friendly'],
      aiPrediction: 'Safe for tourists. High police presence and good infrastructure.'
    },
    'Kaziranga National Park': { 
      score: 78, risk: 'medium', factors: ['wildlife-area', 'guided-tours-recommended', 'weather-dependent'],
      aiPrediction: 'Generally safe with guided tours. Weather and wildlife activity may affect safety.'
    },
    'Majuli Island': { 
      score: 82, risk: 'low', factors: ['cultural-site', 'local-community', 'ferry-dependent'],
      aiPrediction: 'Safe cultural destination. Ferry schedules may affect accessibility.'
    },
    'Imphal City': { 
      score: 80, risk: 'medium', factors: ['urban-area', 'political-sensitivity', 'curfew-possible'],
      aiPrediction: 'Moderately safe. Monitor local political situation and curfew timings.'
    },
    'Kangla Fort': { 
      score: 88, risk: 'low', factors: ['historical-site', 'security-presence', 'day-visits-recommended'],
      aiPrediction: 'Safe historical site with security. Best visited during daytime hours.'
    },
    'Restricted Forest Area': { 
      score: 35, risk: 'high', factors: ['unauthorized-access', 'wildlife-danger', 'no-communication'],
      aiPrediction: 'HIGH RISK: Unauthorized area with wildlife dangers and no communication coverage.'
    }
  },

  // Police units with detailed info
  policeUnits: [
    {
      id: 'unit-001',
      name: 'Tourist Police Unit Alpha',
      type: 'tourist_police',
      status: 'available',
      location: { lat: 26.1445, lng: 91.7362 },
      officers: [
        { name: 'Inspector Ravi Kumar', rank: 'Inspector', languages: ['Hindi', 'English', 'Assamese'] },
        { name: 'Constable Meera Devi', rank: 'Constable', languages: ['Hindi', 'English', 'Bengali'] }
      ],
      contactNumber: '+91-3612-123456',
      equipment: ['GPS Tracker', 'First Aid Kit', 'Communication Radio'],
      jurisdiction: 'Kaziranga-Guwahati Route'
    },
    {
      id: 'unit-002',
      name: 'Emergency Response Team Bravo',
      type: 'emergency',
      status: 'on_duty',
      location: { lat: 25.2744, lng: 91.8789 },
      officers: [
        { name: 'Inspector Bhaskar Das', rank: 'Inspector', languages: ['Hindi', 'English', 'Assamese'] },
        { name: 'Constable Anita Sharma', rank: 'Constable', languages: ['Hindi', 'English'] }
      ],
      contactNumber: '+91-361-100',
      equipment: ['Medical Kit', 'GPS Tracker', 'Emergency Vehicle'],
      jurisdiction: 'Guwahati Metropolitan'
    },
    {
      id: 'unit-003',
      name: 'Cyber Crime Unit',
      type: 'cyber_crime',
      status: 'available',
      location: { lat: 24.6637, lng: 93.9063 },
      officers: [
        { name: 'Sub-Inspector Tech Guru', rank: 'Sub-Inspector', languages: ['Hindi', 'English', 'Manipuri'] }
      ],
      contactNumber: '+91-385-2414',
      equipment: ['Laptop', 'Digital Forensics Kit', 'Communication Radio'],
      jurisdiction: 'Manipur State'
    }
  ],

  alerts: [],
  
  // Enhanced geofences with AI risk assessment
  geofences: [
    {
      id: 'geofence-001',
      name: 'Kaziranga Safe Zone',
      type: 'safe_zone',
      riskLevel: 'low',
      aiRisk: { score: 82, prediction: 'Safe with wildlife precautions' },
      geometry: {
        type: 'circle',
        center: { lat: 26.5775, lng: 93.1742 },
        radius: 5000
      }
    },
    {
      id: 'geofence-002', 
      name: 'Restricted Forest Area',
      type: 'restricted_zone',
      riskLevel: 'high',
      aiRisk: { score: 25, prediction: 'HIGH RISK: Unauthorized access prohibited' },
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
  ]
};

class SitarEnhancedServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = new Server(this.server, {
      cors: { origin: "*", methods: ["GET", "POST"] }
    });
    this.port = process.env.PORT || 3000;
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupAIUpdates();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../public')));
  }

  setupRoutes() {
    // Main route selector
    this.app.get('/', (req, res) => {
      res.send(this.getAppSelectorHTML());
    });

    // Tourist Mobile App
    this.app.get('/tourist', (req, res) => {
      res.send(this.getTouristAppHTML());
    });

    // Police Dashboard
    this.app.get('/police', (req, res) => {
      res.send(this.getPoliceDashboardHTML());
    });

    // Admin Control Panel
    this.app.get('/admin', (req, res) => {
      res.send(this.getAdminPanelHTML());
    });

    // AI Analytics Board
    this.app.get('/analytics', (req, res) => {
      res.send(this.getAnalyticsBoardHTML());
    });

    // API Routes
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'sitar-enhanced-mvp',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        apps: ['tourist', 'police', 'admin', 'analytics']
      });
    });

    // AI Location Safety Prediction
    this.app.post('/api/v1/ai/location-safety', (req, res) => {
      const { latitude, longitude, destination } = req.body;
      
      // Simulate AI prediction
      const locationName = destination || this.getNearestLocation(latitude, longitude);
      const safetyData = mockData.locationSafety[locationName] || {
        score: 70,
        risk: 'medium',
        factors: ['unknown-area', 'limited-data'],
        aiPrediction: 'Limited data available. Exercise normal caution.'
      };

      // Enhanced AI prediction with weather and time factors
      const currentHour = new Date().getHours();
      const timeRisk = currentHour < 6 || currentHour > 22 ? 'higher' : 'normal';
      
      res.json({
        success: true,
        data: {
          location: locationName,
          coordinates: { latitude, longitude },
          safety: safetyData,
          timeRisk,
          recommendation: this.generateAIRecommendation(safetyData, timeRisk),
          lastUpdated: new Date().toISOString()
        }
      });
    });

    // Tourist login/profile
    this.app.post('/api/v1/tourist/login', (req, res) => {
      const { phoneNumber, otp } = req.body;
      const tourist = mockData.tourists.find(t => t.phoneNumber === phoneNumber);
      
      if (tourist && otp === '123456') {
        res.json({
          success: true,
          data: tourist,
          token: 'mock-jwt-token-' + tourist.id
        });
      } else {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid phone number or OTP' }
        });
      }
    });

    // All existing API routes
    this.setupExistingRoutes();
  }

  setupExistingRoutes() {
    // Tourist endpoints
    this.app.get('/api/v1/tourists', (req, res) => {
      res.json({ success: true, data: mockData.tourists });
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

      // AI-powered nearest unit selection
      const nearestUnit = this.findNearestPoliceUnit(alert.location);
      
      // Broadcast to all connected clients
      this.io.emit('emergency_alert', {
        type: 'emergency_alert',
        data: alert,
        assignedUnit: nearestUnit
      });

      // Simulate police dispatch
      setTimeout(() => {
        this.io.emit('police_dispatched', {
          type: 'police_dispatched', 
          data: {
            alertId: alert.id,
            unit: nearestUnit,
            estimatedArrival: this.calculateETA(nearestUnit.location, alert.location)
          }
        });
      }, 2000);

      res.status(201).json({
        success: true,
        data: alert,
        assignedUnit: nearestUnit,
        message: '🚨 EMERGENCY ALERT ACTIVATED! Police units have been dispatched to your location. Stay calm, help is on the way!'
      });
    });

    // Other existing routes...
    this.app.get('/api/v1/alerts', (req, res) => {
      res.json({ success: true, data: mockData.alerts });
    });

    this.app.get('/api/v1/geofences', (req, res) => {
      res.json({ success: true, data: mockData.geofences });
    });

    this.app.get('/api/v1/police', (req, res) => {
      res.json({ success: true, data: mockData.policeUnits });
    });

    this.app.get('/api/v1/analytics', (req, res) => {
      res.json({
        success: true,
        data: this.generateAnalytics()
      });
    });
  }

  // AI Helper Functions
  getNearestLocation(lat, lng) {
    const locations = Object.keys(mockData.locationSafety);
    return locations[Math.floor(Math.random() * locations.length)];
  }

  generateAIRecommendation(safetyData, timeRisk) {
    if (safetyData.score > 80) {
      return timeRisk === 'higher' ? 
        'Safe location, but consider daytime visits for better experience.' :
        'Safe to visit. Enjoy your trip!';
    } else if (safetyData.score > 60) {
      return 'Exercise normal caution. Stay with groups and inform others of your plans.';
    } else {
      return 'HIGH RISK AREA: Avoid visiting. Consider alternative destinations.';
    }
  }

  findNearestPoliceUnit(location) {
    let nearest = mockData.policeUnits[0];
    let minDistance = this.calculateDistance(nearest.location, location);
    
    mockData.policeUnits.forEach(unit => {
      const distance = this.calculateDistance(unit.location, location);
      if (distance < minDistance && unit.status === 'available') {
        nearest = unit;
        minDistance = distance;
      }
    });
    
    return nearest;
  }

  calculateDistance(loc1, loc2) {
    const R = 6371; // Earth's radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lng - loc1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  calculateETA(from, to) {
    const distance = this.calculateDistance(from, to);
    const timeMinutes = Math.round((distance / 60) * 60); // Assuming 60 km/h average speed
    return Math.max(timeMinutes, 3) + ' minutes'; // Minimum 3 minutes
  }

  generateAnalytics() {
    return {
      touristAnalytics: {
        totalTourists: mockData.tourists.length,
        activeTourists: mockData.tourists.filter(t => t.status === 'active').length,
        byNationality: mockData.tourists.reduce((acc, t) => {
          acc[t.nationality] = (acc[t.nationality] || 0) + 1;
          return acc;
        }, {}),
        averageSafetyScore: mockData.tourists.reduce((sum, t) => sum + t.safetyScore, 0) / mockData.tourists.length
      },
      alertAnalytics: {
        totalAlerts: mockData.alerts.length,
        openAlerts: mockData.alerts.filter(a => a.status === 'open').length,
        criticalAlerts: mockData.alerts.filter(a => a.severity === 'critical').length,
        averageResponseTime: '4.2 minutes'
      },
      locationAnalytics: {
        safestLocations: Object.entries(mockData.locationSafety)
          .sort(([,a], [,b]) => b.score - a.score)
          .slice(0, 3)
          .map(([name, data]) => ({ name, score: data.score })),
        riskiestLocations: Object.entries(mockData.locationSafety)
          .sort(([,a], [,b]) => a.score - b.score)
          .slice(0, 3)
          .map(([name, data]) => ({ name, score: data.score }))
      }
    };
  }

  setupWebSocket() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 Client connected: ${socket.id}`);

      socket.on('join_room', (room) => {
        socket.join(room);
        console.log(`User joined room: ${room}`);
      });

      socket.on('tourist_location_update', (data) => {
        const tourist = mockData.tourists.find(t => t.id === data.touristId);
        if (tourist) {
          tourist.currentLocation = data.location;
          
          // AI-powered safety check for new location
          const locationSafety = this.checkLocationSafety(data.location);
          
          this.io.to('police').emit('location_update', {
            touristId: data.touristId,
            location: data.location,
            safetyScore: tourist.safetyScore,
            locationSafety,
            timestamp: new Date().toISOString()
          });
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  checkLocationSafety(location) {
    const locationName = this.getNearestLocation(location.lat, location.lng);
    return mockData.locationSafety[locationName] || {
      score: 70,
      risk: 'medium',
      aiPrediction: 'Normal precautions advised'
    };
  }

  setupAIUpdates() {
    // Simulate AI model updates every 2 minutes
    setInterval(() => {
      // Update location safety scores with AI
      Object.keys(mockData.locationSafety).forEach(location => {
        const current = mockData.locationSafety[location];
        current.score += (Math.random() - 0.5) * 5;
        current.score = Math.max(20, Math.min(95, current.score));
        
        // Update AI prediction based on score changes
        if (current.score > 80) {
          current.risk = 'low';
        } else if (current.score > 60) {
          current.risk = 'medium';
        } else {
          current.risk = 'high';
        }
      });

      this.io.emit('ai_safety_update', {
        timestamp: new Date().toISOString(),
        locationSafety: mockData.locationSafety
      });
    }, 120000); // 2 minutes
  }

  // HTML Templates for different apps
  getAppSelectorHTML() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SITAR - Select Your App</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
            }
            .container {
                text-align: center;
                max-width: 1000px;
                padding: 40px;
            }
            h1 {
                font-size: 3em;
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .subtitle {
                font-size: 1.2em;
                margin-bottom: 50px;
                opacity: 0.9;
            }
            .apps-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 30px;
                margin-top: 40px;
            }
            .app-card {
                background: rgba(255,255,255,0.1);
                backdrop-filter: blur(10px);
                padding: 40px 30px;
                border-radius: 20px;
                border: 1px solid rgba(255,255,255,0.2);
                transition: all 0.3s ease;
                cursor: pointer;
                text-decoration: none;
                color: white;
                position: relative;
                overflow: hidden;
            }
            .app-card:hover {
                transform: translateY(-10px);
                background: rgba(255,255,255,0.2);
                box-shadow: 0 20px 40px rgba(0,0,0,0.2);
            }
            .app-card:before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #ff6b6b, #4ecdc4);
            }
            .app-icon {
                font-size: 4em;
                margin-bottom: 20px;
                display: block;
            }
            .app-title {
                font-size: 1.5em;
                font-weight: bold;
                margin-bottom: 15px;
            }
            .app-description {
                opacity: 0.8;
                line-height: 1.5;
            }
            .features {
                margin-top: 40px;
                opacity: 0.7;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🛡️ SITAR Enhanced</h1>
            <div class="subtitle">
                Smart Integrated Tourist Assistance & Response System<br>
                Choose your application interface
            </div>
            
            <div class="apps-grid">
                <a href="/tourist" class="app-card">
                    <div class="app-icon">📱</div>
                    <div class="app-title">Tourist App</div>
                    <div class="app-description">
                        Mobile interface for tourists with SOS, location tracking, and safety scores
                    </div>
                </a>
                
                <a href="/police" class="app-card">
                    <div class="app-icon">👮</div>
                    <div class="app-title">Police Dashboard</div>
                    <div class="app-description">
                        Real-time monitoring, emergency response, and incident management
                    </div>
                </a>
                
                <a href="/admin" class="app-card">
                    <div class="app-icon">⚙️</div>
                    <div class="app-title">Admin Panel</div>
                    <div class="app-description">
                        System administration, user management, and configuration
                    </div>
                </a>
                
                <a href="/analytics" class="app-card">
                    <div class="app-icon">🤖</div>
                    <div class="app-title">AI Analytics</div>
                    <div class="app-description">
                        AI-powered location safety predictions and advanced analytics
                    </div>
                </a>
            </div>
            
            <div class="features">
                ✨ Real-time Emergency Response | 🔒 Blockchain Identity | 🌍 Multi-language Support | 📊 AI Safety Predictions
            </div>
        </div>
    </body>
    </html>
    `;
  }

  getTouristAppHTML() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SITAR Tourist App</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: #f8f9fa;
                min-height: 100vh;
            }
            .mobile-container {
                max-width: 400px;
                margin: 0 auto;
                background: white;
                min-height: 100vh;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
                position: relative;
            }
            .header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                color: white;
                padding: 20px;
                text-align: center;
                position: relative;
            }
            .back-btn {
                position: absolute;
                left: 20px;
                top: 50%;
                transform: translateY(-50%);
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 8px 12px;
                border-radius: 20px;
                cursor: pointer;
                text-decoration: none;
            }
            .profile-card {
                background: linear-gradient(135deg, #4facfe, #00f2fe);
                margin: 20px;
                padding: 20px;
                border-radius: 15px;
                color: white;
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            .safety-score {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 15px;
            }
            .score-circle {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: rgba(255,255,255,0.2);
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 18px;
                font-weight: bold;
            }
            .location-info {
                background: rgba(255,255,255,0.1);
                padding: 15px;
                border-radius: 10px;
                margin-top: 15px;
            }
            .quick-actions {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                padding: 20px;
            }
            .action-btn {
                background: white;
                border: 2px solid #e9ecef;
                border-radius: 15px;
                padding: 20px;
                text-align: center;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                color: #333;
            }
            .action-btn:hover {
                border-color: #667eea;
                background: #f8f9ff;
            }
            .action-icon {
                font-size: 2em;
                margin-bottom: 10px;
                display: block;
            }
            .sos-btn {
                position: fixed;
                bottom: 30px;
                left: 50%;
                transform: translateX(-50%);
                background: #ff4757;
                color: white;
                border: none;
                width: 80px;
                height: 80px;
                border-radius: 50%;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 10px 30px rgba(255,71,87,0.4);
                z-index: 1000;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { box-shadow: 0 10px 30px rgba(255,71,87,0.4); }
                50% { box-shadow: 0 15px 40px rgba(255,71,87,0.6); }
                100% { box-shadow: 0 10px 30px rgba(255,71,87,0.4); }
            }
            .alerts-section {
                padding: 20px;
            }
            .section-title {
                font-size: 1.2em;
                font-weight: bold;
                margin-bottom: 15px;
                color: #333;
            }
            .ai-safety-card {
                background: linear-gradient(135deg, #a8edea, #fed6e3);
                padding: 20px;
                border-radius: 15px;
                margin: 20px;
                box-shadow: 0 10px 20px rgba(0,0,0,0.1);
            }
            .ai-title {
                font-size: 1.1em;
                font-weight: bold;
                margin-bottom: 10px;
                color: #333;
            }
            .ai-prediction {
                background: rgba(255,255,255,0.7);
                padding: 15px;
                border-radius: 10px;
                margin-top: 10px;
                color: #333;
                font-size: 0.9em;
                line-height: 1.4;
            }
        </style>
    </head>
    <body>
        <div class="mobile-container">
            <div class="header">
                <a href="/" class="back-btn">← Back</a>
                <h2>🛡️ SITAR Tourist</h2>
                <div style="font-size: 0.9em; opacity: 0.8;">Stay Safe, Stay Connected</div>
            </div>

            <div class="profile-card">
                <div class="safety-score">
                    <div>
                        <div style="font-size: 1.1em; font-weight: bold;">Priya Sharma</div>
                        <div style="opacity: 0.8;">India • Tourist ID: T001</div>
                    </div>
                    <div class="score-circle" id="safetyScore">92%</div>
                </div>
                <div class="location-info">
                    <div style="font-size: 0.9em; opacity: 0.8;">📍 Current Location</div>
                    <div style="font-weight: bold;" id="currentLocation">Guwahati City Center</div>
                    <div style="font-size: 0.8em; opacity: 0.7; margin-top: 5px;" id="locationTime">
                        Last updated: ${new Date().toLocaleTimeString()}
                    </div>
                </div>
            </div>

            <div class="ai-safety-card">
                <div class="ai-title">🤖 AI Safety Assistant</div>
                <div>Your next destination: <strong>Kaziranga National Park</strong></div>
                <div class="ai-prediction" id="aiPrediction">
                    🟢 Generally safe with guided tours. Weather and wildlife activity may affect safety. 
                    Best time to visit: 6 AM - 4 PM. Recommended to book guided safari tours.
                </div>
            </div>

            <div class="quick-actions">
                <div class="action-btn" onclick="checkRoute()">
                    <span class="action-icon">🗺️</span>
                    <div>Check Route Safety</div>
                </div>
                <div class="action-btn" onclick="findNearbyHelp()">
                    <span class="action-icon">🏥</span>
                    <div>Nearby Help</div>
                </div>
                <div class="action-btn" onclick="shareLocation()">
                    <span class="action-icon">📍</span>
                    <div>Share Location</div>
                </div>
                <div class="action-btn" onclick="translateText()">
                    <span class="action-icon">🌐</span>
                    <div>Translate</div>
                </div>
            </div>

            <div class="alerts-section">
                <div class="section-title">🔔 Safety Alerts</div>
                <div id="personalAlerts">
                    <div style="background: #e8f5e8; padding: 15px; border-radius: 10px; margin-bottom: 10px;">
                        <div style="font-weight: bold; color: #2e7d32;">✅ All Clear</div>
                        <div style="font-size: 0.9em; color: #4a5568;">No active safety concerns in your area</div>
                    </div>
                </div>
            </div>
        </div>

        <button class="sos-btn" onclick="triggerSOS()">
            SOS
        </button>

        <script>
            const socket = io();
            let currentUser = {
                id: 'tourist-001',
                name: 'Priya Sharma',
                location: { lat: 25.2744, lng: 91.8789 }
            };

            socket.emit('join_room', 'tourist');

            // Real-time updates
            socket.on('ai_safety_update', (data) => {
                updateAIPrediction(data.locationSafety);
            });

            socket.on('emergency_alert', (data) => {
                if (data.data.touristId !== currentUser.id) {
                    showNotification('⚠️ Emergency Alert in Your Area', data.data.message);
                }
            });

            function triggerSOS() {
                if (confirm('🚨 ACTIVATE EMERGENCY SOS?\\n\\nThis will immediately alert police and emergency services to your location.')) {
                    fetch('/api/v1/sos', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            touristId: currentUser.id,
                            message: 'Emergency SOS activated from mobile app',
                            location: currentUser.location
                        })
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            alert('✅ ' + result.message);
                        } else {
                            alert('❌ Failed to send SOS: ' + result.error.message);
                        }
                    });
                }
            }

            function checkRoute() {
                fetch('/api/v1/ai/location-safety', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        latitude: 26.1445,
                        longitude: 91.7362,
                        destination: 'Kaziranga National Park'
                    })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        document.getElementById('aiPrediction').innerHTML = 
                            '🤖 ' + result.data.recommendation + '<br><br>' +
                            '<strong>AI Analysis:</strong> ' + result.data.safety.aiPrediction;
                    }
                });
            }

            function findNearbyHelp() {
                alert('🏥 Nearby Help:\\n\\n1. Guwahati Medical College - 2.3 km\\n2. Police Station - 1.8 km\\n3. Tourist Information Center - 0.5 km\\n\\nEmergency: 108 | Police: 100');
            }

            function shareLocation() {
                if (navigator.share) {
                    navigator.share({
                        title: 'My Current Location - SITAR',
                        text: 'I am currently at Guwahati City Center. Tracking via SITAR Tourist Safety System.',
                        url: window.location.href
                    });
                } else {
                    alert('📍 Location shared with emergency contacts:\\n\\nRajesh Sharma (Father)\\n+91-9876543211\\n\\nMessage: "I am safe at Guwahati City Center. Last updated: ' + new Date().toLocaleString() + '"');
                }
            }

            function translateText() {
                const languages = ['Hindi', 'Assamese', 'Bengali', 'English'];
                const selected = prompt('Select language:\\n\\n1. Hindi\\n2. Assamese\\n3. Bengali\\n4. English\\n\\nEnter number:');
                
                if (selected && selected >= 1 && selected <= 4) {
                    alert('🌐 Language changed to: ' + languages[selected-1] + '\\n\\nAll interface text will now display in your selected language. Emergency phrases and help text are also translated.');
                }
            }

            function updateAIPrediction(locationSafety) {
                const kaziranga = locationSafety['Kaziranga National Park'];
                if (kaziranga) {
                    document.getElementById('aiPrediction').innerHTML = 
                        '🤖 ' + kaziranga.aiPrediction + 
                        '<br><br>Safety Score: ' + Math.round(kaziranga.score) + '/100';
                }
            }

            function showNotification(title, message) {
                if ('Notification' in window && Notification.permission === 'granted') {
                    new Notification(title, { body: message });
                }
            }

            // Simulate location updates
            setInterval(() => {
                // Simulate minor location changes
                currentUser.location.lat += (Math.random() - 0.5) * 0.001;
                currentUser.location.lng += (Math.random() - 0.5) * 0.001;
                
                socket.emit('tourist_location_update', {
                    touristId: currentUser.id,
                    location: currentUser.location
                });
                
                document.getElementById('locationTime').textContent = 
                    'Last updated: ' + new Date().toLocaleTimeString();
            }, 30000);

            // Request notification permission
            if ('Notification' in window && Notification.permission !== 'granted') {
                Notification.requestPermission();
            }
        </script>
    </body>
    </html>
    `;
  }

  // Continue with other HTML templates...
  getPoliceDashboardHTML() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SITAR Police Dashboard</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #1a1a1a;
                color: #ffffff;
                min-height: 100vh;
            }
            .header {
                background: linear-gradient(135deg, #2c3e50, #34495e);
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            }
            .back-btn {
                background: rgba(255,255,255,0.1);
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                text-decoration: none;
            }
            .status-indicators {
                display: flex;
                gap: 20px;
            }
            .status-item {
                text-align: center;
            }
            .status-value {
                font-size: 1.5em;
                font-weight: bold;
                color: #3498db;
            }
            .main-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                padding: 20px;
                height: calc(100vh - 80px);
            }
            .panel {
                background: #2c2c2c;
                border-radius: 10px;
                padding: 20px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            }
            .panel-title {
                font-size: 1.3em;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #3498db;
                color: #3498db;
            }
            .alert-item {
                background: #333;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
                border-left: 4px solid #e74c3c;
            }
            .alert-critical {
                border-left-color: #e74c3c;
                animation: flashRed 2s infinite;
            }
            .alert-high {
                border-left-color: #f39c12;
            }
            .alert-medium {
                border-left-color: #f1c40f;
            }
            .alert-low {
                border-left-color: #3498db;
            }
            @keyframes flashRed {
                0%, 100% { background: #333; }
                50% { background: #4a2c2c; }
            }
            .tourist-item {
                background: #333;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .safety-badge {
                padding: 5px 10px;
                border-radius: 15px;
                font-size: 0.8em;
                font-weight: bold;
            }
            .safety-high { background: #27ae60; color: white; }
            .safety-medium { background: #f39c12; color: white; }
            .safety-low { background: #e74c3c; color: white; }
            .action-buttons {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }
            .btn {
                background: #3498db;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 5px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            .btn:hover {
                background: #2980b9;
                transform: translateY(-2px);
            }
            .btn-danger {
                background: #e74c3c;
            }
            .btn-danger:hover {
                background: #c0392b;
            }
            .connection-status {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 10px 20px;
                border-radius: 25px;
                background: #27ae60;
                z-index: 1000;
            }
        </style>
    </head>
    <body>
        <div class="connection-status" id="connectionStatus">
            🟢 Connected
        </div>

        <div class="header">
            <div style="display: flex; align-items: center; gap: 15px;">
                <a href="/" class="back-btn">← Back</a>
                <h1>👮 SITAR Police Dashboard</h1>
            </div>
            <div class="status-indicators">
                <div class="status-item">
                    <div class="status-value" id="activeAlerts">0</div>
                    <div>Active Alerts</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="activeTourists">3</div>
                    <div>Tourists Online</div>
                </div>
                <div class="status-item">
                    <div class="status-value" id="availableUnits">3</div>
                    <div>Units Available</div>
                </div>
            </div>
        </div>

        <div class="main-content">
            <div class="panel">
                <div class="panel-title">🚨 Emergency Alerts</div>
                <div id="emergencyAlerts">
                    <div style="text-align: center; color: #7f8c8d; margin-top: 50px;">
                        <div style="font-size: 3em;">✅</div>
                        <div>No active emergencies</div>
                        <div style="font-size: 0.9em; margin-top: 10px;">All tourists are safe</div>
                    </div>
                </div>
            </div>

            <div class="panel">
                <div class="panel-title">👥 Tourist Monitoring</div>
                <div id="touristList">
                    <div class="tourist-item">
                        <div>
                            <div style="font-weight: bold;">Priya Sharma</div>
                            <div style="font-size: 0.9em; color: #bdc3c7;">📍 Guwahati City Center</div>
                            <div style="font-size: 0.8em; color: #95a5a6;">Last update: 2 min ago</div>
                        </div>
                        <div>
                            <div class="safety-badge safety-high">92% Safe</div>
                        </div>
                    </div>
                    
                    <div class="tourist-item">
                        <div>
                            <div style="font-weight: bold;">David Johnson</div>
                            <div style="font-size: 0.9em; color: #bdc3c7;">📍 Kaziranga National Park</div>
                            <div style="font-size: 0.8em; color: #95a5a6;">Last update: 5 min ago</div>
                        </div>
                        <div>
                            <div class="safety-badge safety-medium">88% Safe</div>
                        </div>
                    </div>
                    
                    <div class="tourist-item">
                        <div>
                            <div style="font-weight: bold;">Chen Wei</div>
                            <div style="font-size: 0.9em; color: #bdc3c7;">📍 Imphal City</div>
                            <div style="font-size: 0.8em; color: #95a5a6;">Last update: 1 min ago</div>
                        </div>
                        <div>
                            <div class="safety-badge safety-high">95% Safe</div>
                        </div>
                    </div>
                </div>

                <div class="action-buttons">
                    <button class="btn" onclick="refreshTourists()">🔄 Refresh</button>
                    <button class="btn" onclick="viewMap()">🗺️ View Map</button>
                    <button class="btn" onclick="sendBroadcast()">📢 Broadcast</button>
                </div>
            </div>
        </div>

        <script>
            const socket = io();
            let alerts = [];

            socket.emit('join_room', 'police');

            socket.on('emergency_alert', (data) => {
                addEmergencyAlert(data);
                document.getElementById('activeAlerts').textContent = alerts.length;
                playAlertSound();
            });

            socket.on('location_update', (data) => {
                updateTouristLocation(data);
            });

            function addEmergencyAlert(alertData) {
                alerts.push(alertData.data);
                
                const alertsContainer = document.getElementById('emergencyAlerts');
                alertsContainer.innerHTML = alerts.map(alert => \`
                    <div class="alert-item alert-\${alert.severity}">
                        <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                            <strong>🚨 \${alert.title}</strong>
                            <span style="font-size: 0.8em; opacity: 0.7;">\${new Date(alert.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <div style="margin-bottom: 10px;">\${alert.message}</div>
                        <div style="font-size: 0.9em; color: #bdc3c7;">
                            📍 Location: \${alert.location.lat?.toFixed(4)}, \${alert.location.lng?.toFixed(4)}
                        </div>
                        <div style="font-size: 0.9em; color: #bdc3c7;">
                            📞 Tourist: \${alert.touristName} (\${alert.touristPhone})
                        </div>
                        <div class="action-buttons">
                            <button class="btn" onclick="respondToAlert('\${alert.id}')">🚔 Respond</button>
                            <button class="btn" onclick="callTourist('\${alert.touristPhone}')">📞 Call</button>
                            <button class="btn btn-danger" onclick="escalateAlert('\${alert.id}')">⚡ Escalate</button>
                        </div>
                    </div>
                \`).join('');
            }

            function respondToAlert(alertId) {
                alert('🚔 Unit dispatched to emergency location!\\n\\nETA: 6 minutes\\nOfficers: Inspector Ravi Kumar, Constable Meera Devi\\nContact: +91-3612-123456');
            }

            function callTourist(phone) {
                alert('📞 Calling tourist: ' + phone + '\\n\\nEstablishing secure communication channel...\\nCall connected. Speaking with tourist now.');
            }

            function escalateAlert(alertId) {
                alert('⚡ Alert escalated!\\n\\n• Additional units dispatched\\n• Medical team alerted\\n• Senior officer notified\\n• Emergency services coordinated');
            }

            function refreshTourists() {
                document.getElementById('activeTourists').textContent = '3';
                alert('🔄 Tourist data refreshed\\n\\nAll 3 tourists are actively tracked\\nLocation data updated\\nSafety scores recalculated');
            }

            function viewMap() {
                alert('🗺️ Opening Tactical Map\\n\\n• Real-time tourist positions\\n• Police unit locations\\n• Geofence boundaries\\n• Emergency routes\\n\\n[Map interface would load here]');
            }

            function sendBroadcast() {
                const message = prompt('📢 Enter broadcast message for all tourists:');
                if (message) {
                    alert('✅ Broadcast sent to all tourists:\\n\\n"' + message + '"\\n\\nDelivered via:\\n• Mobile notifications\\n• SMS backup\\n• Audio announcements');
                }
            }

            function playAlertSound() {
                // Create audio context for alert sound
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                
                oscillator.start();
                oscillator.stop(audioContext.currentTime + 0.5);
            }

            // Connection status
            socket.on('connect', () => {
                document.getElementById('connectionStatus').innerHTML = '🟢 Connected';
                document.getElementById('connectionStatus').style.background = '#27ae60';
            });

            socket.on('disconnect', () => {
                document.getElementById('connectionStatus').innerHTML = '🔴 Disconnected';
                document.getElementById('connectionStatus').style.background = '#e74c3c';
            });
        </script>
    </body>
    </html>
    `;
  }

  getAdminPanelHTML() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SITAR Admin Panel</title>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #f8f9fa;
                color: #333;
            }
            .header {
                background: linear-gradient(135deg, #6c5ce7, #a29bfe);
                color: white;
                padding: 20px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .back-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                text-decoration: none;
                margin-right: 20px;
            }
            .admin-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 20px;
                padding: 20px;
            }
            .admin-card {
                background: white;
                border-radius: 10px;
                padding: 25px;
                box-shadow: 0 5px 15px rgba(0,0,0,0.1);
                border-top: 4px solid #6c5ce7;
            }
            .card-title {
                font-size: 1.3em;
                font-weight: bold;
                margin-bottom: 20px;
                color: #2d3436;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .metric {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .metric:last-child {
                border-bottom: none;
            }
            .metric-value {
                font-size: 1.5em;
                font-weight: bold;
                color: #6c5ce7;
            }
            .btn-group {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 20px;
            }
            .btn {
                background: #6c5ce7;
                color: white;
                border: none;
                padding: 12px;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 0.9em;
            }
            .btn:hover {
                background: #5a4fcf;
                transform: translateY(-2px);
            }
            .btn-secondary {
                background: #74b9ff;
            }
            .btn-secondary:hover {
                background: #0984e3;
            }
            .btn-danger {
                background: #fd79a8;
            }
            .btn-danger:hover {
                background: #e84393;
            }
            .config-section {
                margin-top: 20px;
            }
            .config-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 0;
                border-bottom: 1px solid #e9ecef;
            }
            .toggle {
                width: 50px;
                height: 25px;
                background: #ddd;
                border-radius: 25px;
                position: relative;
                cursor: pointer;
                transition: background 0.3s ease;
            }
            .toggle.active {
                background: #6c5ce7;
            }
            .toggle::after {
                content: '';
                position: absolute;
                width: 21px;
                height: 21px;
                background: white;
                border-radius: 50%;
                top: 2px;
                left: 2px;
                transition: transform 0.3s ease;
            }
            .toggle.active::after {
                transform: translateX(25px);
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div style="display: flex; align-items: center;">
                <a href="/" class="back-btn">← Back</a>
                <div>
                    <h1>⚙️ SITAR Admin Panel</h1>
                    <div style="opacity: 0.8; margin-top: 5px;">System Administration & Configuration</div>
                </div>
            </div>
        </div>

        <div class="admin-grid">
            <div class="admin-card">
                <div class="card-title">📊 System Overview</div>
                <div class="metric">
                    <span>Total Registered Tourists</span>
                    <span class="metric-value">1,247</span>
                </div>
                <div class="metric">
                    <span>Active Sessions</span>
                    <span class="metric-value">89</span>
                </div>
                <div class="metric">
                    <span>Police Units Online</span>
                    <span class="metric-value">15</span>
                </div>
                <div class="metric">
                    <span>System Uptime</span>
                    <span class="metric-value">99.7%</span>
                </div>
            </div>

            <div class="admin-card">
                <div class="card-title">🚨 Alert Management</div>
                <div class="metric">
                    <span>Open Alerts</span>
                    <span class="metric-value" style="color: #e74c3c;">3</span>
                </div>
                <div class="metric">
                    <span>Resolved Today</span>
                    <span class="metric-value">12</span>
                </div>
                <div class="metric">
                    <span>Average Response Time</span>
                    <span class="metric-value">4.2m</span>
                </div>
                <div class="btn-group">
                    <button class="btn" onclick="viewAllAlerts()">View All Alerts</button>
                    <button class="btn btn-secondary" onclick="generateReport()">Generate Report</button>
                </div>
            </div>

            <div class="admin-card">
                <div class="card-title">👮 Police Management</div>
                <div class="metric">
                    <span>Total Officers</span>
                    <span class="metric-value">45</span>
                </div>
                <div class="metric">
                    <span>On Duty</span>
                    <span class="metric-value">32</span>
                </div>
                <div class="metric">
                    <span>Available Units</span>
                    <span class="metric-value">8</span>
                </div>
                <div class="btn-group">
                    <button class="btn" onclick="manageOfficers()">Manage Officers</button>
                    <button class="btn btn-secondary" onclick="dispatchUnits()">Dispatch Units</button>
                </div>
            </div>

            <div class="admin-card">
                <div class="card-title">🗺️ Geofence Management</div>
                <div class="metric">
                    <span>Active Geofences</span>
                    <span class="metric-value">23</span>
                </div>
                <div class="metric">
                    <span>Safe Zones</span>
                    <span class="metric-value">15</span>
                </div>
                <div class="metric">
                    <span>Restricted Areas</span>
                    <span class="metric-value">8</span>
                </div>
                <div class="btn-group">
                    <button class="btn" onclick="editGeofences()">Edit Geofences</button>
                    <button class="btn btn-secondary" onclick="addGeofence()">Add New Zone</button>
                </div>
            </div>

            <div class="admin-card">
                <div class="card-title">🔧 System Configuration</div>
                <div class="config-section">
                    <div class="config-item">
                        <span>Real-time Tracking</span>
                        <div class="toggle active" onclick="toggleFeature(this)"></div>
                    </div>
                    <div class="config-item">
                        <span>AI Anomaly Detection</span>
                        <div class="toggle active" onclick="toggleFeature(this)"></div>
                    </div>
                    <div class="config-item">
                        <span>Blockchain Integration</span>
                        <div class="toggle active" onclick="toggleFeature(this)"></div>
                    </div>
                    <div class="config-item">
                        <span>SMS Notifications</span>
                        <div class="toggle active" onclick="toggleFeature(this)"></div>
                    </div>
                    <div class="config-item">
                        <span>Debug Mode</span>
                        <div class="toggle" onclick="toggleFeature(this)"></div>
                    </div>
                </div>
            </div>

            <div class="admin-card">
                <div class="card-title">🔒 Security & Compliance</div>
                <div class="metric">
                    <span>Failed Login Attempts</span>
                    <span class="metric-value" style="color: #e74c3c;">7</span>
                </div>
                <div class="metric">
                    <span>Data Encryption</span>
                    <span class="metric-value" style="color: #00b894;">AES-256</span>
                </div>
                <div class="metric">
                    <span>Privacy Compliance</span>
                    <span class="metric-value" style="color: #00b894;">✓ GDPR</span>
                </div>
                <div class="btn-group">
                    <button class="btn" onclick="viewSecurityLogs()">Security Logs</button>
                    <button class="btn btn-danger" onclick="emergencyShutdown()">Emergency Stop</button>
                </div>
            </div>
        </div>

        <script>
            function viewAllAlerts() {
                alert('📋 Alert Management System\\n\\n• 3 Open alerts requiring attention\\n• 12 Resolved alerts today\\n• 2 False alarms flagged\\n• Average resolution time: 4.2 minutes\\n\\n[Detailed alert management interface would load here]');
            }

            function generateReport() {
                alert('📊 Generating System Report...\\n\\n✅ Tourist safety statistics\\n✅ Response time analytics\\n✅ Geofence breach analysis\\n✅ Officer performance metrics\\n\\nReport will be emailed to admin@sitar.gov.in');
            }

            function manageOfficers() {
                alert('👮 Officer Management\\n\\n• 45 Total officers in system\\n• 32 Currently on duty\\n• 8 Available for dispatch\\n• 5 Officers in high-priority areas\\n\\n[Officer management interface would load here]');
            }

            function dispatchUnits() {
                alert('🚔 Unit Dispatch System\\n\\nAvailable Units:\\n• Tourist Police Unit Alpha - Kaziranga\\n• Emergency Response Bravo - Guwahati\\n• Cyber Crime Unit - Imphal\\n\\n[Unit dispatch interface would load here]');
            }

            function editGeofences() {
                alert('🗺️ Geofence Editor\\n\\n• 23 Active geofences\\n• 15 Safe zones configured\\n• 8 Restricted areas marked\\n• Map-based editing interface\\n\\n[Geofence management would load here]');
            }

            function addGeofence() {
                const name = prompt('Enter name for new geofence:');
                if (name) {
                    alert('✅ New geofence "' + name + '" created\\n\\nNext steps:\\n1. Define boundary coordinates\\n2. Set risk level\\n3. Configure alert rules\\n4. Activate monitoring');
                }
            }

            function toggleFeature(element) {
                element.classList.toggle('active');
                const feature = element.parentElement.querySelector('span').textContent;
                const status = element.classList.contains('active') ? 'enabled' : 'disabled';
                
                setTimeout(() => {
                    alert('⚙️ Configuration Updated\\n\\n' + feature + ' is now ' + status.toUpperCase() + '\\n\\nChanges will take effect immediately across all connected devices.');
                }, 100);
            }

            function viewSecurityLogs() {
                alert('🔒 Security Audit Log\\n\\nRecent Events:\\n• 7 Failed login attempts (blocked)\\n• 1 Suspicious API access (monitored)\\n• 15 Successful authentications\\n• 0 Data breaches detected\\n\\n[Full security interface would load here]');
            }

            function emergencyShutdown() {
                if (confirm('⚠️ EMERGENCY SHUTDOWN\\n\\nThis will immediately stop all SITAR services. Only use in critical situations.\\n\\nAre you sure?')) {
                    alert('🚨 EMERGENCY SHUTDOWN INITIATED\\n\\n• All services stopping\\n• Tourists will be notified\\n• Emergency protocols activated\\n• Incident logged for review');
                }
            }
        </script>
    </body>
    </html>
    `;
  }

  getAnalyticsBoardHTML() {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SITAR AI Analytics</title>
        <script src="/socket.io/socket.io.js"></script>
        <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: #0a0e27;
                color: #ffffff;
                min-height: 100vh;
                overflow-x: hidden;
            }
            .header {
                background: linear-gradient(135deg, #667eea, #764ba2);
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
                box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
            }
            .back-btn {
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                cursor: pointer;
                text-decoration: none;
            }
            .ai-status {
                display: flex;
                align-items: center;
                gap: 10px;
                background: rgba(255,255,255,0.1);
                padding: 8px 16px;
                border-radius: 20px;
            }
            .ai-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #00ff88;
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            .analytics-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 20px;
                padding: 20px;
            }
            .analytics-card {
                background: linear-gradient(135deg, #1e3c72, #2a5298);
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
                border: 1px solid rgba(255,255,255,0.1);
                position: relative;
                overflow: hidden;
            }
            .analytics-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 3px;
                background: linear-gradient(90deg, #00ff88, #00d4ff, #ff0080);
                animation: shimmer 3s infinite;
            }
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            .card-title {
                font-size: 1.4em;
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
                color: #00ff88;
            }
            .ai-prediction {
                background: rgba(0,255,136,0.1);
                border: 1px solid rgba(0,255,136,0.3);
                border-radius: 10px;
                padding: 20px;
                margin: 15px 0;
                position: relative;
            }
            .ai-prediction::before {
                content: '🤖';
                position: absolute;
                top: -10px;
                left: 15px;
                background: #1e3c72;
                padding: 5px;
                border-radius: 50%;
            }
            .prediction-text {
                font-size: 1.1em;
                line-height: 1.5;
                margin-top: 10px;
            }
            .risk-meter {
                display: flex;
                align-items: center;
                gap: 15px;
                margin: 20px 0;
            }
            .meter-bar {
                flex: 1;
                height: 20px;
                background: #333;
                border-radius: 10px;
                overflow: hidden;
                position: relative;
            }
            .meter-fill {
                height: 100%;
                border-radius: 10px;
                transition: all 1s ease;
                background: linear-gradient(90deg, #00ff88, #ffff00, #ff4444);
            }
            .location-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-top: 20px;
            }
            .location-item {
                background: rgba(255,255,255,0.1);
                padding: 15px;
                border-radius: 10px;
                text-align: center;
                transition: all 0.3s ease;
                cursor: pointer;
            }
            .location-item:hover {
                background: rgba(255,255,255,0.2);
                transform: translateY(-5px);
            }
            .safety-score {
                font-size: 2em;
                font-weight: bold;
                margin: 10px 0;
            }
            .score-high { color: #00ff88; }
            .score-medium { color: #ffff00; }
            .score-low { color: #ff4444; }
            .trend-chart {
                height: 200px;
                background: rgba(0,0,0,0.3);
                border-radius: 10px;
                margin: 20px 0;
                display: flex;
                align-items: end;
                justify-content: space-around;
                padding: 20px;
                position: relative;
            }
            .chart-bar {
                background: linear-gradient(to top, #667eea, #764ba2);
                border-radius: 5px 5px 0 0;
                transition: all 0.5s ease;
                min-width: 20px;
                animation: chartAnimation 2s ease-in-out;
            }
            @keyframes chartAnimation {
                from { height: 0; }
            }
            .ai-insight {
                background: linear-gradient(135deg, #ff9a9e, #fecfef);
                color: #333;
                padding: 20px;
                border-radius: 10px;
                margin: 15px 0;
                font-weight: 500;
            }
            .real-time-feed {
                max-height: 300px;
                overflow-y: auto;
                background: rgba(0,0,0,0.3);
                border-radius: 10px;
                padding: 15px;
            }
            .feed-item {
                padding: 10px;
                border-bottom: 1px solid rgba(255,255,255,0.1);
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .feed-item:last-child {
                border-bottom: none;
            }
            .feed-icon {
                width: 30px;
                height: 30px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8em;
            }
            .icon-safe { background: #00ff88; color: #000; }
            .icon-warning { background: #ffff00; color: #000; }
            .icon-danger { background: #ff4444; color: #fff; }
        </style>
    </head>
    <body>
        <div class="header">
            <div style="display: flex; align-items: center; gap: 15px;">
                <a href="/" class="back-btn">← Back</a>
                <div>
                    <h1>🤖 SITAR AI Analytics</h1>
                    <div style="opacity: 0.8;">Powered by Advanced Machine Learning</div>
                </div>
            </div>
            <div class="ai-status">
                <div class="ai-dot"></div>
                <span>AI Models Active</span>
            </div>
        </div>

        <div class="analytics-grid">
            <div class="analytics-card">
                <div class="card-title">🎯 Location Safety Predictions</div>
                <div class="ai-prediction">
                    <div style="font-weight: bold; color: #00ff88;">AI ANALYSIS</div>
                    <div class="prediction-text">
                        Based on historical data, weather patterns, and real-time events, 
                        <strong>Kaziranga National Park</strong> shows medium risk levels due to 
                        monsoon season approaching. Recommend guided tours and morning visits.
                    </div>
                </div>
                
                <div class="location-grid">
                    <div class="location-item" onclick="analyzeLocation('Guwahati')">
                        <div>📍 Guwahati</div>
                        <div class="safety-score score-high">85</div>
                        <div style="font-size: 0.8em;">Low Risk</div>
                    </div>
                    <div class="location-item" onclick="analyzeLocation('Kaziranga')">
                        <div>📍 Kaziranga</div>
                        <div class="safety-score score-medium">78</div>
                        <div style="font-size: 0.8em;">Medium Risk</div>
                    </div>
                    <div class="location-item" onclick="analyzeLocation('Majuli')">
                        <div>📍 Majuli</div>
                        <div class="safety-score score-high">82</div>
                        <div style="font-size: 0.8em;">Low Risk</div>
                    </div>
                    <div class="location-item" onclick="analyzeLocation('Imphal')">
                        <div>📍 Imphal</div>
                        <div class="safety-score score-medium">80</div>
                        <div style="font-size: 0.8em;">Medium Risk</div>
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="card-title">📊 Tourist Behavior Analysis</div>
                <div class="ai-insight">
                    🔍 <strong>Pattern Detected:</strong> 73% of tourists visit Kaziranga between 6-10 AM, 
                    correlating with 28% higher safety scores during these hours.
                </div>
                
                <div class="trend-chart">
                    <div class="chart-bar" style="height: 60%;"></div>
                    <div class="chart-bar" style="height: 85%;"></div>
                    <div class="chart-bar" style="height: 45%;"></div>
                    <div class="chart-bar" style="height: 70%;"></div>
                    <div class="chart-bar" style="height: 90%;"></div>
                    <div class="chart-bar" style="height: 65%;"></div>
                    <div class="chart-bar" style="height: 80%;"></div>
                </div>
                
                <div class="risk-meter">
                    <span>Overall Risk Level:</span>
                    <div class="meter-bar">
                        <div class="meter-fill" style="width: 35%;"></div>
                    </div>
                    <span>Low</span>
                </div>
            </div>

            <div class="analytics-card">
                <div class="card-title">⚡ Real-time AI Insights</div>
                <div class="real-time-feed" id="aiFeed">
                    <div class="feed-item">
                        <div class="feed-icon icon-safe">✓</div>
                        <div>
                            <div style="font-weight: bold;">Safety Score Updated</div>
                            <div style="font-size: 0.9em; opacity: 0.7;">Priya Sharma: 92% → 94% (improved)</div>
                        </div>
                    </div>
                    <div class="feed-item">
                        <div class="feed-icon icon-warning">⚠</div>
                        <div>
                            <div style="font-weight: bold;">Route Deviation Detected</div>
                            <div style="font-size: 0.9em; opacity: 0.7;">David Johnson: Minor deviation from planned route</div>
                        </div>
                    </div>
                    <div class="feed-item">
                        <div class="feed-icon icon-safe">🤖</div>
                        <div>
                            <div style="font-weight: bold;">AI Model Updated</div>
                            <div style="font-size: 0.9em; opacity: 0.7;">Location safety algorithm improved with new data</div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="card-title">🌊 Predictive Weather Impact</div>
                <div class="ai-prediction">
                    <div style="font-weight: bold; color: #ffff00;">WEATHER ALERT</div>
                    <div class="prediction-text">
                        AI models predict 68% chance of heavy rainfall in Kaziranga region tomorrow. 
                        Tourist safety scores may drop by 15-20%. Recommend indoor activities or 
                        postponing outdoor tours.
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 20px;">
                    <div style="background: rgba(255,255,0,0.1); padding: 15px; border-radius: 10px;">
                        <div style="font-weight: bold;">Tomorrow's Forecast</div>
                        <div style="font-size: 2em;">🌧️</div>
                        <div>Heavy Rain Expected</div>
                        <div style="font-size: 0.9em; opacity: 0.7;">68% Probability</div>
                    </div>
                    <div style="background: rgba(255,68,68,0.1); padding: 15px; border-radius: 10px;">
                        <div style="font-weight: bold;">Safety Impact</div>
                        <div style="font-size: 2em; color: #ff4444;">⚠️</div>
                        <div>Increased Risk</div>
                        <div style="font-size: 0.9em; opacity: 0.7;">-15 to -20 points</div>
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="card-title">🎭 Behavioral Anomalies</div>
                <div class="ai-insight">
                    🧠 <strong>AI Learning:</strong> Unusual pattern detected - tourists visiting 
                    restricted areas increased by 23% this week. Correlates with local festival season.
                </div>
                
                <div style="margin-top: 20px;">
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
                        <span>Normal Behavior Confidence</span>
                        <span style="font-weight: bold;">87%</span>
                    </div>
                    <div class="meter-bar">
                        <div class="meter-fill" style="width: 87%; background: linear-gradient(90deg, #00ff88, #00d4ff);"></div>
                    </div>
                </div>
                
                <div style="margin-top: 20px; font-size: 0.9em;">
                    <div>🔍 <strong>Anomalies Detected:</strong></div>
                    <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
                        • Tourist group moving unusually fast (possible vehicle transport)
                    </div>
                    <div style="margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.1); border-radius: 5px;">
                        • Extended stay in single location (>4 hours)
                    </div>
                </div>
            </div>

            <div class="analytics-card">
                <div class="card-title">🚀 AI Recommendations</div>
                <div class="ai-prediction">
                    <div style="font-weight: bold; color: #00d4ff;">SMART SUGGESTIONS</div>
                    <div class="prediction-text">
                        1. Deploy additional patrol units to Kaziranga during 2-4 PM peak risk hours<br>
                        2. Send proactive safety tips to tourists entering medium-risk zones<br>
                        3. Activate weather-based geofence adjustments for tomorrow
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 20px;">
                    <button style="background: #00ff88; color: #000; border: none; padding: 12px; border-radius: 8px; cursor: pointer;" onclick="implementRecommendation(1)">
                        ✅ Implement All
                    </button>
                    <button style="background: #667eea; color: #fff; border: none; padding: 12px; border-radius: 8px; cursor: pointer;" onclick="customizeRecommendations()">
                        ⚙️ Customize
                    </button>
                </div>
            </div>
        </div>

        <script>
            const socket = io();

            // Real-time AI updates
            socket.on('ai_safety_update', (data) => {
                updateLocationSafety(data.locationSafety);
                addAIFeedItem('🤖 AI Model Updated', 'Location safety scores recalculated with latest data');
            });

            function analyzeLocation(location) {
                fetch('/api/v1/ai/location-safety', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        latitude: 26.1445,
                        longitude: 91.7362,
                        destination: location
                    })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        showAIAnalysis(location, result.data);
                    }
                });
            }

            function showAIAnalysis(location, data) {
                alert(
                    '🤖 AI Analysis for ' + location + ':\\n\\n' +
                    '🎯 Safety Score: ' + data.safety.score + '/100\\n' +
                    '⚠️ Risk Level: ' + data.safety.risk.toUpperCase() + '\\n' +
                    '🕐 Time Risk: ' + data.timeRisk + '\\n\\n' +
                    '📊 AI Prediction:\\n' + data.safety.aiPrediction + '\\n\\n' +
                    '💡 Recommendation:\\n' + data.recommendation
                );
            }

            function implementRecommendation(type) {
                alert('✅ AI Recommendations Implemented!\\n\\n' +
                      '• Additional patrol units deployed to high-risk areas\\n' +
                      '• Proactive safety notifications sent to tourists\\n' +
                      '• Weather-based geofence adjustments activated\\n' +
                      '• AI monitoring increased by 25%\\n\\n' +
                      'Expected improvement: +12% in overall safety scores');
            }

            function customizeRecommendations() {
                alert('⚙️ AI Recommendation Customization\\n\\n' +
                      'Available Options:\\n' +
                      '1. Adjust risk thresholds\\n' +
                      '2. Customize alert timing\\n' +
                      '3. Modify patrol schedules\\n' +
                      '4. Update notification templates\\n\\n' +
                      '[Advanced AI configuration interface would load here]');
            }

            function addAIFeedItem(title, description) {
                const feed = document.getElementById('aiFeed');
                const newItem = document.createElement('div');
                newItem.className = 'feed-item';
                newItem.innerHTML = \`
                    <div class="feed-icon icon-safe">🤖</div>
                    <div>
                        <div style="font-weight: bold;">\${title}</div>
                        <div style="font-size: 0.9em; opacity: 0.7;">\${description}</div>
                    </div>
                \`;
                feed.insertBefore(newItem, feed.firstChild);
                
                // Keep only last 5 items
                while (feed.children.length > 5) {
                    feed.removeChild(feed.lastChild);
                }
            }

            function updateLocationSafety(locationSafety) {
                // Update safety scores in real-time
                Object.keys(locationSafety).forEach(location => {
                    const element = document.querySelector(\`[onclick*="\${location}"]\`);
                    if (element) {
                        const scoreElement = element.querySelector('.safety-score');
                        if (scoreElement) {
                            scoreElement.textContent = Math.round(locationSafety[location].score);
                        }
                    }
                });
            }

            // Simulate real-time AI updates
            setInterval(() => {
                const insights = [
                    'Pattern recognition improved by 3.2%',
                    'New anomaly detection algorithm deployed',
                    'Weather prediction model updated',
                    'Tourist behavior analysis completed',
                    'Safety score algorithm optimized'
                ];
                
                const randomInsight = insights[Math.floor(Math.random() * insights.length)];
                addAIFeedItem('AI System Update', randomInsight);
            }, 45000);
        </script>
    </body>
    </html>
    `;
  }

  start() {
    this.server.listen(this.port, () => {
      console.log('\n🌟 ===============================================');
      console.log('🚀 SITAR Enhanced MVP Server is running!');
      console.log('===============================================');
      console.log(`🏠 App Selector: http://localhost:${this.port}`);
      console.log(`📱 Tourist App: http://localhost:${this.port}/tourist`);
      console.log(`👮 Police Dashboard: http://localhost:${this.port}/police`);
      console.log(`⚙️ Admin Panel: http://localhost:${this.port}/admin`);
      console.log(`🤖 AI Analytics: http://localhost:${this.port}/analytics`);
      console.log('===============================================\n');
      console.log('✨ NEW FEATURES:');
      console.log('   🎯 Separate apps for different users');
      console.log('   🤖 AI-powered location safety predictions');
      console.log('   📊 Advanced analytics dashboard');
      console.log('   🔮 Predictive weather impact analysis');
      console.log('   🎭 Behavioral anomaly detection');
      console.log('   ⚡ Real-time AI insights');
      console.log('\n💡 Try the AI location safety API!');
      console.log('===============================================\n');
    });
  }
}

// Start the enhanced MVP server
const server = new SitarEnhancedServer();
server.start();
