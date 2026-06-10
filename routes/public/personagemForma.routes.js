import { Router } from 'express';
import personagemFormaController from '../../controllers/personagemForma.controller.js';

const router = Router();

// Listagem geral (suporta ?personagem_id=X)
router.get('/', personagemFormaController.index);

// Detalhes de uma forma específica
router.get('/:id', personagemFormaController.show);

export default router;