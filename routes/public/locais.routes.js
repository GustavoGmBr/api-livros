import { Router } from 'express';
import locaisController from '../../controllers/locais.controller.js';

const router = Router();

router.get('/', locaisController.index);
router.get('/:id', locaisController.show);

export default router;