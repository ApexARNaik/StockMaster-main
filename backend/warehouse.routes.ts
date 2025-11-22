import { Router } from 'express';
import { prisma } from './index.mjs';
import { authenticateToken, authorizeRole } from './middleware/auth.js';

const warehouseRouter = Router();

// GET all warehouses
warehouseRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: { stocks: { include: { product: true } } },
    });
    res.status(200).json(warehouses);
  } catch (error) {
    console.error('Error fetching warehouses:', error);
    res.status(500).json({ error: 'Failed to fetch warehouses' });
  }
});

// CREATE warehouse (ADMIN only)
warehouseRouter.post('/', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  const { name, location } = req.body;

  try {
    if (!name || !location) {
      return res.status(400).json({ error: 'Name and location are required' });
    }

    const warehouse = await prisma.warehouse.create({
      data: { name, location },
    });

    res.status(201).json({ message: 'Warehouse created successfully', warehouse });
  } catch (error) {
    console.error('Error creating warehouse:', error);
    res.status(500).json({ error: 'Failed to create warehouse' });
  }
});

export default warehouseRouter;