import { Router } from 'express';
import itensController from '../../controllers/itens.controller.js';

const router = Router();

router.get('/', itensController.index);
router.get('/:id', itensController.show);

export default router;