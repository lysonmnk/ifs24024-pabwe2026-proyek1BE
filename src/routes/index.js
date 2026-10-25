import { Router } from 'express';
import authRoutes from './auth.routes.js';
import materiRoutes from './materi.routes.js';
import sesiRoutes from './sesi.routes.js';
import { sendSuccess } from '../utils/response.js';

const router = Router();

router.get('/health', (req, res) => {
  return sendSuccess(res, 200, 'API siap melayani permintaan', {
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

router.use('/auth', authRoutes);
router.use('/materi', materiRoutes);
router.use('/sesi', sesiRoutes);

export default router;
