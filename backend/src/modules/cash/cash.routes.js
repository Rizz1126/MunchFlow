import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as cashService from './cash.service.js';

const router = Router();

// GET /api/cash — List transactions with filters
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { type, category, startDate, endDate, limit } = req.query;
    const transactions = await cashService.getTransactions({ type, category, startDate, endDate, limit });
    res.json(transactions);
  } catch (err) {
    next(err);
  }
});

// POST /api/cash — Create transaction
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { type, category, amount, description, paymentMethod, transactionDate } = req.body;
    if (!type || !category || !amount) {
      return res.status(400).json({ error: 'Type, category, dan amount wajib diisi.' });
    }
    const tx = await cashService.createTransaction({
      ...req.body,
      createdBy: req.user.userId,
    });
    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
});

// GET /api/cash/summary — Aggregated summary
router.get('/summary', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await cashService.getSummary(startDate, endDate);
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

// GET /api/cash/export — CSV export
router.get('/export', authenticate, async (req, res, next) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    const transactions = await cashService.getTransactions({ type, category, startDate, endDate, limit: 10000 });

    // Build CSV manually
    const headers = ['ID', 'Tipe', 'Kategori', 'Jumlah', 'Deskripsi', 'Metode Pembayaran', 'Tanggal Transaksi', 'Dibuat'];
    const rows = transactions.map(t => [
      t.id, t.type, t.category, t.amount, 
      `"${(t.description || '').replace(/"/g, '""')}"`,
      t.paymentMethod, t.transactionDate, t.createdAt
    ].join(','));

    const csv = [headers.join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="kas_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send('\uFEFF' + csv); // BOM for Excel UTF-8 compatibility
  } catch (err) {
    next(err);
  }
});

// GET /api/cash/expense-breakdown — For charts
router.get('/expense-breakdown', authenticate, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const breakdown = await cashService.getExpenseBreakdown(startDate, endDate);
    res.json(breakdown);
  } catch (err) {
    next(err);
  }
});

export default router;
