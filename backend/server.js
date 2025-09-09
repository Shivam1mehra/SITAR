const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');
const redis = require('redis');
const WebSocket = require('ws');
const https = require('https');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/location');
const emergencyRoutes = require('./routes/emergency');
const geofenceRoutes = require('./routes/geofence');
const analyticsRoutes = require('./routes/analytics');
const blockchainRoutes = require('./routes/blockchain');

// Import services
const LocationService = require('./services/LocationService');
const AIService = require('./services/AIService');
const BlockchainService = require('./services/BlockchainService');
const NotificationService = require('./services/NotificationService');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'sitar_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'sitar_db',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Redis connection for caching and sessions
const redisClient = redis.createClient({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
});

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true,
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/location', authenticateToken, locationRoutes);
app.use('/api/emergency', authenticateToken, emergencyRoutes);
app.use('/api/geofence', authenticateToken, geofenceRoutes);
app.use('/api/analytics', authenticateToken, analyticsRoutes);
app.use('/api/blockchain', authenticateToken, blockchainRoutes);

// WebSocket server for real-time updates
const server = https.createServer({
  key: fs.readFileSync(process.env.SSL_KEY || './certs/key.pem'),
  cert: fs.readFileSync(process.env.SSL_CERT || './certs/cert.pem')
}, app);

const wss = new WebSocket.Server({ server });

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection established');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('WebSocket message error:', error);
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Invalid message format' 
      }));
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
});

async function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'location_update':
      await LocationService.updateLocation(data.userId, data.location);
      
      // Check for geofence violations
      const violations = await LocationService.checkGeofenceViolations(
        data.userId, 
        data.location
      );
      
      if (violations.length > 0) {
        // Broadcast to police dashboard
        broadcastToPolice({
          type: 'geofence_violation',
          userId: data.userId,
          violations: violations,
          timestamp: new Date().toISOString()
        });
      }
      break;
      
    case 'emergency_alert':
      await handleEmergencyAlert(data);
      break;
      
    case 'heartbeat':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
      
    default:
      ws.send(JSON.stringify({ 
        type: 'error', 
        message: 'Unknown message type' 
      }));
  }
}

async function handleEmergencyAlert(alertData) {
  try {
    // Store alert in database
    const query = `
      INSERT INTO emergency_alerts (user_id, type, location, severity, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, created_at
    `;
    
    const result = await pool.query(query, [
      alertData.userId,
      alertData.type,
      JSON.stringify(alertData.location),
      alertData.severity || 'high',
      JSON.stringify(alertData.metadata || {})
    ]);
    
    const alertId = result.rows[0].id;
    
    // Record on blockchain for immutability
    await BlockchainService.recordEmergencyAlert({
      alertId,
      userId: alertData.userId,
      location: alertData.location,
      timestamp: result.rows[0].created_at
    });
    
    // Send notifications to nearby police stations
    await NotificationService.notifyNearbyPolice(alertData.location, {
      alertId,
      type: alertData.type,
      severity: alertData.severity,
      userId: alertData.userId
    });
    
    // AI-powered risk assessment
    const riskAssessment = await AIService.assessEmergencyRisk(alertData);
    
    // Broadcast to all connected police dashboards
    broadcastToPolice({
      type: 'emergency_alert',
      alertId,
      ...alertData,
      riskAssessment,
      timestamp: new Date().toISOString()
    });
    
    console.log(`Emergency alert ${alertId} processed and broadcasted`);
    
  } catch (error) {
    console.error('Error handling emergency alert:', error);
  }
}

function broadcastToPolice(message) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && client.userType === 'police') {
      client.send(JSON.stringify(message));
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  // Close WebSocket server
  wss.close(() => {
    console.log('WebSocket server closed');
  });
  
  // Close database connections
  await pool.end();
  await redisClient.quit();
  
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

server.listen(PORT, () => {
  console.log(`SITAR Backend Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
