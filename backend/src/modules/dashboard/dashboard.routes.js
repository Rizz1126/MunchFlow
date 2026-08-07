import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import * as dashboardService from './dashboard.service.js';

const router = Router();

// GET /api/dashboard/kpi
router.get('/kpi', authenticate, (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to today
    const today = new Date().toISOString().split('T')[0];
    const start = startDate || today;
    const end = endDate || today;

    const kpi = dashboardService.getKPI(start, end);
    res.json(kpi);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/sales-trend
router.get('/sales-trend', authenticate, (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 14;
    const trend = dashboardService.getSalesTrend(days);
    res.json(trend);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/expense-composition
router.get('/expense-composition', authenticate, (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const composition = dashboardService.getExpenseComposition(startDate, endDate);
    res.json(composition);
  } catch (err) {
    next(err);
  }
});

// GET /api/dashboard/alerts
router.get('/alerts', authenticate, (req, res, next) => {
  try {
    const alerts = dashboardService.getLowStockAlerts();
    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

export default router;
