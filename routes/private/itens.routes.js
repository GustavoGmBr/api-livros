import { Router } from 'express';
import itensController from '../../controllers/itens.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import {uploadItem} from '../../middlewares/upload.js';

const router = Router();

router.use(authMiddleware);

router.post('/', uploadItem, itensController.store);
router.put('/:id', uploadItem, itensController.update);
router.delete('/:id', itensController.destroy);

export default router;