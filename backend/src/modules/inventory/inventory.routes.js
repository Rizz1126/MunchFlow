import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as inventoryService from './inventory.service.js';

const router = Router();

// GET /api/ingredients
router.get('/', authenticate, async (req, res, next) => {
  try {
    res.json(await inventoryService.getAllIngredients());
  } catch (err) {
    next(err);
  }
});

// GET /api/ingredients/alerts — Low stock alerts
router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    res.json(await inventoryService.getLowStockAlerts());
  } catch (err) {
    next(err);
  }
});

// POST /api/ingredients
router.post('/', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const { name, unit, buyPricePerUnit, currentStock, minimumStock } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ error: 'Nama dan satuan wajib diisi.' });
    }
    const ingredient = await inventoryService.createIngredient(req.body);
    res.status(201).json(ingredient);
  } catch (err) {
    next(err);
  }
});

// PUT /api/ingredients/:id
router.put('/:id', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const ingredient = await inventoryService.updateIngredient(parseInt(req.params.id), req.body);
    if (!ingredient) {
      return res.status(404).json({ error: 'Bahan baku tidak ditemukan.' });
    }
    res.json(ingredient);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/ingredients/:id
router.delete('/:id', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const result = await inventoryService.deleteIngredient(parseInt(req.params.id));
    if (!result) {
      return res.status(404).json({ error: 'Bahan baku tidak ditemukan.' });
    }
    res.json({ message: 'Bahan baku berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
});

// POST /api/ingredients/:id/restock — Atomic restock + cash expense
router.post('/:id/restock', authenticate, async (req, res, next) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Jumlah restock harus lebih dari 0.' });
    }
    const ingredient = await inventoryService.restockIngredient(
      parseInt(req.params.id),
      parseFloat(quantity),
      req.user.userId
    );
    res.json(ingredient);
  } catch (err) {
    next(err);
  }
});

export default router;
