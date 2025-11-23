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

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Routes
app.use('/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/categories', categoryRouter);
app.use('/api/warehouses', warehouseRouter);
app.use('/api/documents', documentRouter);
app.use('/api/ledger', ledgerRouter);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Server is running' });
});

// Start the server
const startServer = async () => {
  try {
    console.log('Starting server...');

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
};

startServer();
