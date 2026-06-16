import { Router } from 'express';
import itensController from '../../controllers/itens.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', itensController.store);
router.put('/:id', itensController.update);
router.delete('/:id', itensController.destroy);

export default router;