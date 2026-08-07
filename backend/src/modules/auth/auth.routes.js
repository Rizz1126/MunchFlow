import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { login, getMe } from './auth.service.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    }
    const result = await login(username, password);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res, next) => {
  try {
    const user = getMe(req.user.userId);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

export default router;
