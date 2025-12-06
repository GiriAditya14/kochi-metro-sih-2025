import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

// Routes
import ingestionRoutes from './routes/ingestionRoutes';
import agentRoutes from './routes/agentRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import historyRoutes from './routes/historyRoutes';
import emergencyRoutes from './routes/emergencyRoutes';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/v1/ingestion', ingestionRoutes);
app.use('/api/v1/agents', agentRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/history', historyRoutes);
app.use('/api/v1/emergency', emergencyRoutes);

// WebSocket setup
io.on('connection', (socket) => {
  logger.info(`Client connected: ${socket.id}`);

  socket.on('subscribe-decisions', (date: string) => {
    socket.join(`decisions-${date}`);
    logger.info(`Client ${socket.id} subscribed to decisions for ${date}`);
  });

  socket.on('subscribe-conflicts', () => {
    socket.join('conflicts');
    logger.info(`Client ${socket.id} subscribed to conflicts`);
  });

  socket.on('subscribe-emergencies', () => {
    socket.join('emergencies');
    logger.info(`Client ${socket.id} subscribed to emergencies`);
  });

  socket.on('subscribe-train-tracking', (trainId: string) => {
    socket.join(`train-${trainId}`);
    logger.info(`Client ${socket.id} subscribed to train ${trainId} tracking`);
  });

  socket.on('subscribe-public-announcements', () => {
    socket.join('public-announcements');
    logger.info(`Client ${socket.id} subscribed to public announcements`);
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Export io for use in other modules
export { io };

// Error handler (must be last)
app.use(errorHandler);

// Start server
httpServer.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

