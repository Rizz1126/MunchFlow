import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as posService from './pos.service.js';

const router = Router();

// POST /api/pos/sale — Process a sale (atomic)
router.post('/sale', authenticate, (req, res, next) => {
  try {
    const result = posService.processSale(req.body, req.user.userId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/pos/sales — Recent sales
router.get('/sales', authenticate, (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    res.json(posService.getRecentSales(limit));
  } catch (err) {
    next(err);
  }
});

export default router;
