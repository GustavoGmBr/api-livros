import { Router } from 'express';
import capituloController from '../../controllers/capitulo.controller.js';

const router = Router();

// Lista os capítulos mais recentes para o feed/dashboard
router.get('/', capituloController.listarRecentes);

// Busca por ID ou Título (Slug) - inclui detalhes de personagens participantes
router.get('/:id', capituloController.show);

// Lista hierárquica (Parent/Children) filtrada por Livro
router.get('/livro/:livroId', capituloController.listarPorLivro);

export default router;