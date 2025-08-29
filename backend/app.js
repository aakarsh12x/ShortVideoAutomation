const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Import routes
const apiRoutes = require('./routes/api');
const webRoutes = require('./routes/web');

// Import services
const logger = require('./logger');
const config = require('./config');

class ReelAutomationApp {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.io = socketIo(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }));

    // CORS
    this.app.use(cors({
      origin: config.cors.origin,
      credentials: true
    }));

    // Compression
    this.app.use(compression());

    // Logging
    this.app.use(morgan('combined', {
      stream: { write: message => logger.info(message.trim()) }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP, please try again later.'
    });
    this.app.use('/api/', limiter);

    // Body parsing
    this.app.use(express.json({ limit: '50mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '50mb' }));

    // Static files
    this.app.use(express.static(path.join(__dirname, '../public')));
    this.app.use('/videos', express.static(path.join(__dirname, '../output')));
    this.app.use('/temp', express.static(path.join(__dirname, '../temp')));
  }

  setupRoutes() {
    // API routes
    this.app.use('/api', apiRoutes);
    
    // Web routes
    this.app.use('/', webRoutes);

    // Serve React app for all non-API routes
    this.app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });
  }

  setupSocketIO() {
    this.io.on('connection', (socket) => {
      logger.info(`Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });

      // Handle job cancellation
      socket.on('cancel_job', (data) => {
        logger.info(`Job cancellation requested: ${data.jobId}`);
        // Implement job cancellation logic here
        socket.emit('job_cancelled', { jobId: data.jobId });
      });

      // Handle client joining a room for specific job updates
      socket.on('join_job', (data) => {
        socket.join(`job_${data.jobId}`);
        logger.info(`Client ${socket.id} joined job room: ${data.jobId}`);
      });

      socket.on('leave_job', (data) => {
        socket.leave(`job_${data.jobId}`);
        logger.info(`Client ${socket.id} left job room: ${data.jobId}`);
      });
    });

    // Make io available to other modules
    this.app.set('io', this.io);
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);
      
      res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received, shutting down gracefully');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });

    process.on('SIGINT', () => {
      logger.info('SIGINT received, shutting down gracefully');
      this.server.close(() => {
        logger.info('Process terminated');
        process.exit(0);
      });
    });
  }

  start() {
    const port = config.server.port || 3000;
    
    this.server.listen(port, () => {
      logger.info(`🚀 ReelAutomation server running on port ${port}`);
      logger.info(`📱 Frontend available at: http://localhost:${port}`);
      logger.info(`🔌 API available at: http://localhost:${port}/api`);
      logger.info(`📊 WebSocket available at: ws://localhost:${port}`);
    });

    return this.server;
  }
}

// Create and start the application
const app = new ReelAutomationApp();
app.start();

module.exports = app;
