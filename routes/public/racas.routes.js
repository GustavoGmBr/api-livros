import { Router } from 'express';
import racasController from '../../controllers/racas.controller.js';

const router = Router();

// Lista todas as raças e seus sistemas vinculados
router.get('/', racasController.index);

// Detalhes de uma raça específica
router.get('/:id', racasController.show);

export default router;