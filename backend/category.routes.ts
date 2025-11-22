import { Router } from 'express';
import { prisma } from './index.mjs';
import { authenticateToken, authorizeRole } from './middleware/auth.js';

const categoryRouter = Router();

// GET all categories
categoryRouter.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: { products: true },
    });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// CREATE category (ADMIN only)
categoryRouter.post('/', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  const { name } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const category = await prisma.category.create({
      data: { name },
    });

    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

export default categoryRouter;