import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import * as businessService from './business.service.js';

const router = Router();

// GET /api/businesses — List all businesses (owner: all, kasir: assigned only)
router.get('/', authenticate, async (req, res, next) => {
  try {
    if (req.user.role === 'owner') {
      res.json(await businessService.getAllBusinesses());
    } else {
      res.json(await businessService.getBusinessesByUser(req.user.userId));
    }
  } catch (err) {
    next(err);
  }
});

// POST /api/businesses — Create business (owner only)
router.post('/', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama bisnis wajib diisi.' });
    const biz = await businessService.createBusiness(req.body);
    res.status(201).json(biz);
  } catch (err) {
    next(err);
  }
});

// PUT /api/businesses/:id — Update business (owner only)
router.put('/:id', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const biz = await businessService.updateBusiness(parseInt(req.params.id), req.body);
    if (!biz) return res.status(404).json({ error: 'Bisnis tidak ditemukan.' });
    res.json(biz);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/businesses/:id — Delete business (owner only)
router.delete('/:id', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const result = await businessService.deleteBusiness(parseInt(req.params.id));
    if (!result) return res.status(404).json({ error: 'Bisnis tidak ditemukan.' });
    res.json({ message: 'Bisnis berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/businesses/:id/users — List users assigned to business
router.get('/:id/users', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    res.json(await businessService.getBusinessUsers(parseInt(req.params.id)));
  } catch (err) {
    next(err);
  }
});

// POST /api/businesses/:id/assign — Assign user to business
router.post('/:id/assign', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const { userId, accessibleMenus } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId wajib diisi.' });
    const result = await businessService.assignUserToBusiness(parseInt(userId), parseInt(req.params.id), accessibleMenus);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /api/businesses/:id/access/:userId — Update user access
router.put('/:id/access/:userId', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const { accessibleMenus } = req.body;
    const result = await businessService.updateUserAccess(
      parseInt(req.params.userId),
      parseInt(req.params.id),
      accessibleMenus
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/businesses/:id/unassign/:userId — Unassign user from business
router.delete('/:id/unassign/:userId', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    const result = await businessService.unassignUserFromBusiness(
      parseInt(req.params.userId),
      parseInt(req.params.id)
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/businesses/users/all — List all users (for assignment UI)
router.get('/users/all', authenticate, requireRole('owner'), async (req, res, next) => {
  try {
    res.json(await businessService.getAllUsers());
  } catch (err) {
    next(err);
  }
});

export default router;
