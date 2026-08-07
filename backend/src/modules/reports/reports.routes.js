import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as reportsService from './reports.service.js';

const router = Router();

// GET /api/reports/pnl — Profit & Loss report
router.get('/pnl', authenticate, requireRole('owner'), (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'startDate dan endDate wajib diisi.' });
    }
    const report = reportsService.getProfitLoss(startDate, endDate);
    res.json(report);
  } catch (err) {
    next(err);
  }
});

export default router;
