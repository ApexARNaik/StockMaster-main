import { Router } from 'express';
import { prisma } from './index.mjs';
import { authenticateToken, authorizeRole } from './middleware/auth.js';
import type { AuthRequest } from './types.d.js';

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
documentRouter.post('/', authenticateToken, async (req: AuthRequest, res) => {
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
        createdById: req.userId!,
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
documentRouter.put('/:id/status', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const docId = parseInt(id);
    
    // Get current document
    const currentDoc = await prisma.document.findUnique({
      where: { id: docId },
      include: { documentLines: true },
    });

    if (!currentDoc) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // If changing to "Done", process stock and ledger
    if (status === 'Done' && currentDoc.status !== 'Done') {
      await processDocumentCompletion(currentDoc, req.userId!);
    }

    const document = await prisma.document.update({
      where: { id: docId },
      data: { status },
      include: { documentLines: { include: { product: true } } },
    });

    res.status(200).json({ message: 'Document status updated', document });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// Process stock and ledger when document is marked as Done
async function processDocumentCompletion(doc: any, userId: number) {
  const { type, documentLines, sourceWarehouseId, destWarehouseId } = doc;

  for (const line of documentLines) {
    const { productId, quantity } = line;

    switch (type) {
      case 'RECEIPT':
        // Increase stock at destination warehouse
        if (destWarehouseId) {
          await upsertStock(productId, destWarehouseId, quantity);
          await createLedgerEntry(doc.id, productId, quantity, 'IN', null, destWarehouseId, userId);
        }
        break;

      case 'DELIVERY':
        // Decrease stock at source, increase at destination
        if (sourceWarehouseId) {
          await upsertStock(productId, sourceWarehouseId, -quantity);
          await createLedgerEntry(doc.id, productId, quantity, 'OUT', sourceWarehouseId, null, userId);
        }
        if (destWarehouseId) {
          await upsertStock(productId, destWarehouseId, quantity);
          await createLedgerEntry(doc.id, productId, quantity, 'IN', null, destWarehouseId, userId);
        }
        break;

      case 'TRANSFER':
        // Move stock from source to destination
        if (sourceWarehouseId) {
          await upsertStock(productId, sourceWarehouseId, -quantity);
          await createLedgerEntry(doc.id, productId, quantity, 'OUT', sourceWarehouseId, destWarehouseId, userId);
        }
        if (destWarehouseId) {
          await upsertStock(productId, destWarehouseId, quantity);
          await createLedgerEntry(doc.id, productId, quantity, 'IN', sourceWarehouseId, destWarehouseId, userId);
        }
        break;

      case 'ADJUSTMENT':
        // Adjustments can increase or decrease stock
        if (destWarehouseId) {
          // Increase adjustment
          await upsertStock(productId, destWarehouseId, quantity);
          await createLedgerEntry(doc.id, productId, quantity, 'IN', null, destWarehouseId, userId);
        } else if (sourceWarehouseId) {
          // Decrease adjustment
          await upsertStock(productId, sourceWarehouseId, -quantity);
          await createLedgerEntry(doc.id, productId, quantity, 'OUT', sourceWarehouseId, null, userId);
        }
        break;
    }
  }
}

// Helper: Upsert stock record
// Add in upsertStock function
async function upsertStock(productId: number, warehouseId: number, quantityChange: number) {
  const existingStock = await prisma.stock.findUnique({
    where: { productId_warehouseId: { productId, warehouseId } },
  });

  if (existingStock) {
    const newQuantity = existingStock.quantity + quantityChange;
    
    // ✅ Add validation
    if (newQuantity < 0) {
      throw new Error(`Insufficient stock for product ${productId} in warehouse ${warehouseId}`);
    }
    
    await prisma.stock.update({
      where: { id: existingStock.id },
      data: { quantity: newQuantity },
    });
  } else {
    // ✅ Prevent creating negative stock
    if (quantityChange < 0) {
      throw new Error(`Cannot create negative stock for product ${productId}`);
    }
    
    await prisma.stock.create({
      data: {
        productId,
        warehouseId,
        quantity: Math.max(0, quantityChange),
      },
    });
  }
}

// Helper: Create ledger entry
async function createLedgerEntry(
  documentId: number,
  productId: number,
  quantity: number,
  direction: 'IN' | 'OUT',
  sourceWarehouseId: number | null,
  destWarehouseId: number | null,
  userId: number
) {
  await prisma.ledger.create({
    data: {
      documentId,
      productId,
      quantity,
      direction,
      sourceWarehouseId,
      destWarehouseId,
      userId,
    },
  });
}

export default documentRouter;
