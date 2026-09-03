import { Router } from 'express';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { injectBusinessScope } from '../../middleware/businessScope.js';
import * as modifiersService from './modifiers.service.js';

const router = Router();

router.use(authenticate);
router.use(injectBusinessScope);

// GET /api/modifiers - List all modifiers for the active business
router.get('/', async (req, res, next) => {
  try {
    const businessId = req.businessFilter?.businessId;
    res.json(await modifiersService.getModifiers(businessId));
  } catch (err) {
    next(err);
  }
});

// POST /api/modifiers - Create a modifier
router.post('/', requireRole('owner'), async (req, res, next) => {
  try {
    const businessId = req.businessFilter?.businessId;
    if (!businessId) {
      return res.status(400).json({ error: 'business_id harus disertakan di header/query.' });
    }
    const { name, extraPrice } = req.body;
    if (!name) return res.status(400).json({ error: 'Nama modifier wajib diisi.' });

    const modifier = await modifiersService.createModifier({
      name,
      extraPrice: extraPrice || 0,
      businessId,
    });
    res.status(201).json(modifier);
  } catch (err) {
    next(err);
  }
});

// PUT /api/modifiers/:id - Update a modifier
router.put('/:id', requireRole('owner'), async (req, res, next) => {
  try {
    const businessId = req.businessFilter?.businessId;
    const modifier = await modifiersService.updateModifier(parseInt(req.params.id), req.body, businessId);
    if (!modifier) return res.status(404).json({ error: 'Modifier tidak ditemukan atau akses ditolak.' });
    res.json(modifier);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/modifiers/:id - Delete a modifier
router.delete('/:id', requireRole('owner'), async (req, res, next) => {
  try {
    const businessId = req.businessFilter?.businessId;
    const result = await modifiersService.deleteModifier(parseInt(req.params.id), businessId);
    if (!result) return res.status(404).json({ error: 'Modifier tidak ditemukan atau akses ditolak.' });
    res.json({ message: 'Modifier berhasil dihapus.' });
  } catch (err) {
    next(err);
  }
});

export default router;
