import { Router } from 'express';
import personagemController from '../../controllers/personagem.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import upload from '../../middlewares/upload.js'; 

const router = Router();

// Todas as rotas de escrita/exclusão exigem autenticação
router.use(authMiddleware);

// Criar personagem com upload de imagens
router.post('/', 
  upload.fields([{ name: 'corpo', maxCount: 1 }, { name: 'rosto', maxCount: 1 }]), 
  personagemController.store
);

// Atualizar personagem com upload opcional de novas imagens
router.put('/:id', 
  upload.fields([{ name: 'corpo', maxCount: 1 }, { name: 'rosto', maxCount: 1 }]), 
  personagemController.update
);

// Deletar personagem
router.delete('/:id', personagemController.destroy);

export default router;