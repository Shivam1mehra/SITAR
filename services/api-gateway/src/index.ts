import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { Server as SocketIOServer } from 'socket.io';
import http from 'http';
import { PrismaClient } from '@prisma/client';
import { createClient, RedisClientType } from 'redis';
import { Kafka } from 'kafkajs';
import winston from 'winston';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

// Import controllers and middleware
import { AuthController } from './controllers/AuthController';
import { TouristController } from './controllers/TouristController';
import { AlertController } from './controllers/AlertController';
import { GeofenceController } from './controllers/GeofenceController';
import { AnalyticsController } from './controllers/AnalyticsController';

import { authMiddleware } from './middleware/auth';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { validateRequest } from './middleware/validation';

// Import services
import { NotificationService } from './services/NotificationService';
import { LocationService } from './services/LocationService';
import { SafetyScoreService } from './services/SafetyScoreService';
import { WebSocketManager } from './services/WebSocketManager';

class SitarAPIGateway {
  private app: express.Application;
  private server: http.Server;
  private io: SocketIOServer;
  private prisma: PrismaClient;
  private redis: RedisClientType;
  private kafka: Kafka;
  private port: number;

  // Services
  private notificationService: NotificationService;
  private locationService: LocationService;
  private safetyScoreService: SafetyScoreService;
  private wsManager: WebSocketManager;

  // Controllers
  private authController: AuthController;
  private touristController: TouristController;
  private alertController: AlertController;
  private geofenceController: GeofenceController;
  private analyticsController: AnalyticsController;

  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.port = parseInt(process.env.PORT || '3000', 10);
    
    this.setupMiddleware();
    this.initializeServices();
  }

  private setupMiddleware(): void {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
      hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
      }
    }));

    // CORS
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:19006'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests from this IP, please try again later.'
        }
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use(limiter);
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(requestLogger);
  }

  private async initializeServices(): Promise<void> {
    try {
      logger.info('🚀 Initializing SITAR API Gateway...');

      // Initialize Prisma
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });

      // Initialize Redis
      this.redis = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      });
      
      await this.redis.connect();
      logger.info('✅ Redis connected');

      // Initialize Kafka
      this.kafka = new Kafka({
        clientId: process.env.KAFKA_CLIENT_ID || 'sitar-api-gateway',
        brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
      });

      // Initialize Socket.IO
      this.io = new SocketIOServer(this.server, {
        cors: {
          origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:19006'],
          methods: ['GET', 'POST'],
          credentials: true
        },
        transports: ['websocket', 'polling']
      });

      // Initialize services
      this.notificationService = new NotificationService(this.prisma, this.redis);
      this.locationService = new LocationService(this.prisma, this.redis, this.kafka);
      this.safetyScoreService = new SafetyScoreService(this.prisma, this.redis);
      this.wsManager = new WebSocketManager(this.io, this.prisma);

      // Initialize controllers
      this.authController = new AuthController(this.prisma, this.redis, this.notificationService);
      this.touristController = new TouristController(this.prisma, this.redis, this.locationService);
      this.alertController = new AlertController(this.prisma, this.redis, this.notificationService, this.wsManager);
      this.geofenceController = new GeofenceController(this.prisma, this.redis);
      this.analyticsController = new AnalyticsController(this.prisma, this.redis);

      logger.info('✅ Services initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize services:', error);
      process.exit(1);
    }
  }

  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        service: 'sitar-api-gateway',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // API version info
    this.app.get('/api/v1', (req, res) => {
      res.json({
        name: 'SITAR API Gateway',
        version: '1.0.0',
        description: 'Smart Integrated Tourist Assistance & Response System',
        endpoints: {
          auth: '/api/v1/auth',
          tourists: '/api/v1/tourists',
          alerts: '/api/v1/alerts',
          geofences: '/api/v1/geofences',
          analytics: '/api/v1/analytics',
          blockchain: 'http://localhost:3002/api/v1/identity',
          ai: 'http://localhost:8000/api/v1'
        },
        websocket: {
          endpoint: '/socket.io',
          events: ['location_update', 'alert_created', 'safety_score_update']
        }
      });
    });

    // API Routes
    this.app.use('/api/v1/auth', this.authController.getRouter());
    this.app.use('/api/v1/tourists', authMiddleware, this.touristController.getRouter());
    this.app.use('/api/v1/alerts', authMiddleware, this.alertController.getRouter());
    this.app.use('/api/v1/geofences', authMiddleware, this.geofenceController.getRouter());
    this.app.use('/api/v1/analytics', authMiddleware, this.analyticsController.getRouter());

    // Demo endpoints (for MVP demonstration)
    this.app.get('/api/v1/demo/status', (req, res) => {
      res.json({
        success: true,
        data: {
          totalTourists: 150,
          activeTourists: 89,
          totalAlerts: 12,
          resolvedAlerts: 8,
          averageResponseTime: 4.2, // minutes
          safetyScore: 94.8,
          geofences: {
            total: 45,
            active: 42,
            breaches: 3
          },
          lastUpdated: new Date().toISOString()
        }
      });
    });

    // Mock SOS endpoint for demo
    this.app.post('/api/v1/demo/sos', (req, res) => {
      const { touristId, latitude, longitude, message } = req.body;
      
      // Simulate SOS alert creation
      const alert = {
        id: `alert-${Date.now()}`,
        touristId,
        type: 'PANIC_BUTTON',
        severity: 'CRITICAL',
        status: 'OPEN',
        title: 'Emergency SOS Alert',
        message: message || 'Tourist has activated panic button',
        latitude,
        longitude,
        createdAt: new Date().toISOString()
      };

      // Emit to WebSocket
      this.wsManager.broadcastAlert(alert);

      res.status(201).json({
        success: true,
        data: alert,
        message: 'Emergency alert created successfully. Help is on the way!'
      });
    });

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.originalUrl} not found`,
          suggestion: 'Check API documentation at /api/v1'
        }
      });
    });

    // Error handler
    this.app.use(errorHandler);
  }

  private setupWebSocket(): void {
    this.wsManager.initialize();
    logger.info('✅ WebSocket server initialized');
  }

  public async start(): Promise<void> {
    try {
      // Setup routes and WebSocket
      this.setupRoutes();
      this.setupWebSocket();

      // Start server
      this.server.listen(this.port, () => {
        logger.info(`🚀 SITAR API Gateway running on port ${this.port}`);
        logger.info(`📊 Health check: http://localhost:${this.port}/health`);
        logger.info(`📖 API Documentation: http://localhost:${this.port}/api/v1`);
        logger.info(`🔗 WebSocket: ws://localhost:${this.port}/socket.io`);
        logger.info(`🛡️  Environment: ${process.env.NODE_ENV || 'development'}`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      logger.error('❌ Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      logger.info(`🛑 Received ${signal}. Shutting down gracefully...`);
      
      this.server.close(() => {
        logger.info('✅ HTTP server closed');
        
        // Close database connections
        this.prisma.$disconnect();
        this.redis.quit();
        
        logger.info('✅ Database connections closed');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the application
const main = async () => {
  try {
    const gateway = new SitarAPIGateway();
    await gateway.start();
  } catch (error) {
    logger.error('💥 Application startup failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  main();
}

export default SitarAPIGateway;
