import { Router } from 'express';
import locaisController from '../../controllers/locais.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = Router();

router.use(authMiddleware);

router.post('/', locaisController.store);
router.put('/:id', locaisController.update);
router.delete('/:id', locaisController.destroy);

export default router;