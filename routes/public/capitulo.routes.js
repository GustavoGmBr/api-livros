
import { Router } from 'express';
import capituloController from '../../controllers/capitulo.controller.js';

const router = Router();

// Lista os 3 capítulos mais recentes (para a Home/Dashboard)
router.get('/', capituloController.listarRecentes);

// Busca um capítulo específico por ID ou Título
router.get('/:id', capituloController.show);

// Lista todos os capítulos de um livro específico (organizados por hierarquia)
router.get('/livro/:livroId', capituloController.listarPorLivro);

export default router;