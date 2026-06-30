import { Router } from 'express';
import bestiarioController from '../../controllers/bestiario.controller.js';

const router = Router();

// Listagem geral das criaturas do bestiário
router.get('/', bestiarioController.index);

// Detalhes de uma criatura específica
router.get('/:id', bestiarioController.show);

export default router;