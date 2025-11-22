import { Router } from 'express';
import { prisma } from './index.mjs';
import { authenticateToken, authorizeRole } from './middleware/auth.js';

const productRouter = Router();

// GET all products (accessible by all authenticated users)
productRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        stocks: {
          include: { warehouse: true },
        },
      },
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET single product
productRouter.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id: parseInt(id) },
      include: {
        category: true,
        stocks: {
          include: { warehouse: true },
        },
      },
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// CREATE product (ADMIN/MANAGER only)
productRouter.post('/', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), async (req, res) => {
  const { name, sku, categoryId, uom } = req.body;

  try {
    if (!name || !sku || !categoryId || !uom) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return res.status(400).json({ error: 'SKU already exists' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        categoryId: parseInt(categoryId),
        uom,
        isActive: true,
      },
      include: { category: true },
    });

    res.status(201).json({ message: 'Product created successfully', product });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// UPDATE product (ADMIN/MANAGER only)
productRouter.put('/:id', authenticateToken, authorizeRole(['ADMIN', 'MANAGER']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, sku, categoryId, uom, isActive } = req.body;

    const product = await prisma.product.update({
      where: { id: parseInt(id) },
      data: {
        name,
        sku,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        uom,
        isActive,
      },
      include: { category: true },
    });

    res.status(200).json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE product (ADMIN only)
productRouter.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id: parseInt(id) } });
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default productRouter;