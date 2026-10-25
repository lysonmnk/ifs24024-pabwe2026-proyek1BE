import { Router } from 'express';
import { sesiController } from '../controllers/sesi.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.use(authenticate);
router.delete('/:id', sesiController.delete);

export default router;
