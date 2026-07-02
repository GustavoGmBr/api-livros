import { Router } from 'express';
import capituloController from '../../controllers/capitulo.controller.js';

const router = Router();

// Lista os capítulos mais recentes para o feed/dashboard
router.get('/recentes', capituloController.listarRecentes);

// Busca por ID ou Título (Slug) - inclui detalhes dos participantes
router.get('/:id', capituloController.show);

// Lista hierárquica (Pai/Filhos) filtrada por ID do Livro
router.get('/livro/:livro_id', capituloController.listarPorLivro);

export default router;