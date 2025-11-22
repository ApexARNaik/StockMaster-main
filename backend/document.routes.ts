import { Router } from 'express';
import { prisma } from './index.mjs';
import { authenticateToken, authorizeRole } from './middleware/auth.js';

const documentRouter = Router();

// GET all documents
documentRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const { type, status } = req.query;
    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const documents = await prisma.document.findMany({
      where,
      include: {
        createdBy: true,
        sourceWarehouse: true,
        destWarehouse: true,
        documentLines: { include: { product: true } },
        ledgers: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// CREATE document
documentRouter.post('/', authenticateToken, async (req, res) => {
  const { type, sourceWarehouseId, destWarehouseId, supplierId, items } = req.body;

  try {
    if (!type || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const document = await prisma.document.create({
      data: {
        type,
        status: 'Draft',
        supplierId: supplierId || null,
        sourceWarehouseId: sourceWarehouseId || null,
        destWarehouseId: destWarehouseId || null,
        createdById: (req as any).userId,
        documentLines: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      },
      include: {
        documentLines: { include: { product: true } },
        createdBy: true,
      },
    });

    res.status(201).json({ message: 'Document created successfully', document });
  } catch (error) {
    console.error('Error creating document:', error);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

// UPDATE document status (MANAGER/ADMIN)
documentRouter.put('/:id/status', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const document = await prisma.document.update({
      where: { id: parseInt(id) },
      data: { status },
      include: { documentLines: { include: { product: true } } },
    });

    res.status(200).json({ message: 'Document status updated', document });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

export default documentRouter;