import { Router } from 'express';
import historicoController from '../../controllers/historico.controller.js';

const router = Router();

// Ver a evolução (linha do tempo) de um personagem específico
router.get('/personagem/:personagemId', historicoController.timeline);
// Detalhes de um histórico específico (removido das privadas para evitar duplicidade)
router.get('/:id', historicoController.show);

export default router;