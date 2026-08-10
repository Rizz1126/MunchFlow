import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as recipesService from './recipes.service.js';

const router = Router();

// GET /api/menu
router.get('/', authenticate, async (req, res, next) => {
  try {
    res.json(await recipesService.getAllMenuItems());
  } catch (err) {
    next(err);
  }
});

// GET /api/menu/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const menu = await recipesService.getMenuItemById(parseInt(req.params.id));
    if (!menu) return res.status(404).json({ error: 'Menu tidak ditemukan.' });
    res.json(menu);
  } catch (err) {
    next(err);
  }
});

// POST /api/menu
router.post('/', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const { name, sellingPrice } = req.body;
    if (!name || !sellingPrice) {
      return res.status(400).json({ error: 'Nama dan harga jual wajib diisi.' });
    }
    const menu = await recipesService.createMenuItem(req.body);
    res.status(201).json(menu);
  } catch (err) {
    next(err);
  }
});

// PUT /api/menu/:id
router.put('/:id', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const menu = await recipesService.updateMenuItem(parseInt(req.params.id), req.body);
    if (!menu) return res.status(404).json({ error: 'Menu tidak ditemukan.' });
    res.json(menu);
  } catch (err) {
    next(err);
  }
});

// POST /api/menu/:id/recipe — Set recipe (BOM)
router.post('/:id/recipe', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const { items } = req.body; // [{ingredientId, quantityNeeded}]
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Items resep wajib diisi (array).' });
    }
    const menu = await recipesService.setRecipe(parseInt(req.params.id), items);
    res.json(menu);
  } catch (err) {
    next(err);
  }
});

// GET /api/menu/:id/hpp
router.get('/:id/hpp', authenticate, async (req, res, next) => {
  try {
    const hpp = await recipesService.calculateHpp(parseInt(req.params.id));
    res.json({ menuItemId: parseInt(req.params.id), hpp });
  } catch (err) {
    next(err);
  }
});

export default router;
