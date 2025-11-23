import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './auth.routes.js';
import productRouter from './products.routes.js';
import categoryRouter from './category.routes.js';
import warehouseRouter from './warehouse.routes.js';
import documentRouter from './document.routes.js';
import ledgerRouter from './ledger.routes.js';
import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 3000;

// Validate required environment variables
const validateEnv = () => {
  const required = ['JWT_SECRET', 'DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✓ Environment variables validated');
};

// Middleware
app.use(express.json());

// CORS Configuration - Secure for production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));

// Request logging middleware (useful for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/warehouses', warehouseRouter);
app.use('/api/documents', documentRouter);
app.use('/api/ledger', ledgerRouter);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({ 
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'StockMaster API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth',
      api: '/api'
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal server error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// Start the server
const startServer = async () => {
  try {
    console.log('🚀 Starting StockMaster server...');
    console.log('📍 Environment:', process.env.NODE_ENV || 'development');
    
    // Validate environment variables
    validateEnv();
    
    // Test database connection
    console.log('🔌 Connecting to database...');
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log('✓ Database connected successfully');
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Health check: http://localhost:${PORT}/health`);
      console.log(`✓ API Base URL: http://localhost:${PORT}/api`);
      if (process.env.FRONTEND_URL) {
        console.log(`✓ CORS enabled for: ${process.env.FRONTEND_URL}`);
      }
      console.log('✅ Server started successfully!\n');
    });
  } catch (error) {
    console.error('❌ Failed to start the server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown handlers
const gracefulShutdown = async (signal: string) => {
  console.log(`\n${signal} received, closing server gracefully...`);
  
  try {
    console.log('🔌 Disconnecting from database...');
    await prisma.$disconnect();
    console.log('✓ Database disconnected');
    console.log('👋 Server shut down successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start the server
startServer();
