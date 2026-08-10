import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as dashboardService from './dashboard.service.js';

const router = Router();

// GET /api/dashboard/kpi
router.get('/kpi', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to today
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    const kpi = await dashboardService.getKPI(start, end);
    res.json(kpi);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/sales-trend
router.get('/sales-trend', authenticate, async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const trend = await dashboardService.getSalesTrend(days);
    res.json(trend);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/expense-composition
router.get('/expense-composition', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const composition = await dashboardService.getExpenseComposition(startDate, endDate);
    res.json(composition);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/alerts
router.get('/alerts', authenticate, async (req, res, next) => {
  try {
    const alerts = await dashboardService.getLowStockAlerts();
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

export default router;
