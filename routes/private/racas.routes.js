import { Router } from 'express';
import racasController from '../../controllers/racas.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = Router();

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware);

// Criar nova raça
router.post('/', racasController.store);

// Atualizar dados da raça (nome, base, limite, mundo)
router.put('/:id', racasController.update);

// Deletar raça
router.delete('/:id', racasController.destroy);

export default router;