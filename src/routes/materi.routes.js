import { Router } from 'express';
import { materiController } from '../controllers/materi.controller.js';
import { sesiController } from '../controllers/sesi.controller.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();

router.use(authenticate);

router.get('/', materiController.getAll);
router.post('/', materiController.create);
router.get('/:id', materiController.getById);
router.put('/:id', materiController.update);
router.delete('/:id', materiController.delete);

router.get('/:materiId/sesi', sesiController.getByMateriId);
router.post('/:materiId/sesi', sesiController.create);

export default router;
