import { Router } from 'express';
import inventarioController from '../../controllers/inventario.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';

const router = Router();

// Aplica middleware de autenticação em todas as rotas privadas
router.use(authMiddleware);

// Rotas privadas - operações de escrita e modificação
router.post('/', inventarioController.store);
router.put('/:id', inventarioController.update);
router.patch('/:id/dinheiro', inventarioController.updateDinheiro); // Rota específica para atualizar dinheiro
router.delete('/:id', inventarioController.destroy);

export default router;