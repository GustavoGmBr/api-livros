import { Router } from 'express';
import personagemController from '../../controllers/personagem.controller.js';

const router = Router();

// Listagem geral
router.get('/', personagemController.index);

// Detalhes de um personagem específico
router.get('/:id', personagemController.show);

// Busca o estado do personagem em um capítulo específico (Lógica de Leitura)
router.get('/:id/capitulo/:capituloId', personagemController.buscarParaLeitura);

export default router;