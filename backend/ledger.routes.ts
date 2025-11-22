import { Router } from 'express';
import { prisma } from './index.mjs';
import { authenticateToken } from './middleware/auth.js';

const ledgerRouter = Router();

// GET ledger entries
ledgerRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const { productId, warehouseId, direction } = req.query;
    const where: any = {};
    if (productId) where.productId = parseInt(productId as string);
    if (warehouseId) where.OR = [
      { sourceWarehouseId: parseInt(warehouseId as string) },
      { destWarehouseId: parseInt(warehouseId as string) },
    ];
    if (direction) where.direction = direction;

    const ledgers = await prisma.ledger.findMany({
      where,
      include: {
        product: true,
        document: true,
        user: true,
        sourceWarehouse: true,
        destWarehouse: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    res.status(200).json(ledgers);
  } catch (error) {
    console.error('Error fetching ledger:', error);
    res.status(500).json({ error: 'Failed to fetch ledger' });
  }
});

export default ledgerRouter;