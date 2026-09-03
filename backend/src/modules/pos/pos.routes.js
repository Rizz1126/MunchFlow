import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { injectBusinessScope } from '../../middleware/businessScope.js';
import * as posService from './pos.service.js';

const router = Router();

router.use(authenticate);
router.use(injectBusinessScope);

// POST /api/pos/sale — Process a sale (atomic)
router.post('/sale', async (req, res, next) => {
  try {
    const businessId = req.businessId;
    if (!businessId) {
      return res.status(400).json({ error: 'business_id harus disertakan di header/query.' });
    }
    const result = await posService.processSale(req.body, req.user.userId, businessId);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/pos/sales — Recent sales
router.get('/sales', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    res.json(await posService.getRecentSales(limit, req.businessId, req.businessIds));
  } catch (err) {
    next(err);
  }
});

export default router;
