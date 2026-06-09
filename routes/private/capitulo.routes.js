
import { Router } from 'express';
import capituloController from '../../controllers/capitulo.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = Router();

// Todas as rotas abaixo exigem token JWT válido
router.use(authMiddleware);

// Criação de novo capítulo ou subcapítulo
router.post('/', capituloController.store);

// Atualização de metadados (título, número, ordem)
router.put('/:id', capituloController.update);

// Atualização específica do conteúdo dinâmico (blocos JSON)
router.patch('/:id/conteudo', capituloController.updateConteudo);

// Exclusão de capítulo (com deleção em cascata configurada no Prisma)
router.delete('/:id', capituloController.destroy);

export default router;