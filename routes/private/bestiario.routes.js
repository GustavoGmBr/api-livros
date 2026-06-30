import { Router } from 'express';
import bestiarioController from '../../controllers/bestiario.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { uploadBestiario } from '../../middlewares/upload.js'; // Garantindo o uso do upload.single('bestiario')

const router = Router();

// Todas as rotas de escrita/exclusão do bestiário exigem autenticação
router.use(authMiddleware);

// Criar criatura com upload de imagem única no campo 'bestiario'
router.post('/', uploadBestiario, bestiarioController.store);

// Atualizar criatura com upload opcional de nova imagem
router.put('/:id', uploadBestiario, bestiarioController.update);

// Deletar criatura do bestiário
router.delete('/:id', bestiarioController.destroy);

export default router;