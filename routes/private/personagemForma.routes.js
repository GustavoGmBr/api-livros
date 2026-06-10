import { Router } from 'express';
import personagemFormaController from '../../controllers/personagemForma.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import upload from '../../middlewares/upload.js';

const router = Router();

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware);

// Criar nova forma com upload de imagens (corpo e rosto)
router.post('/', 
  upload.fields([{ name: 'corpo', maxCount: 1 }, { name: 'rosto', maxCount: 1 }]), 
  personagemFormaController.store
);

// Atualizar forma existente com upload opcional
router.put('/:id', 
  upload.fields([{ name: 'corpo', maxCount: 1 }, { name: 'rosto', maxCount: 1 }]), 
  personagemFormaController.update
);

// Deletar forma
router.delete('/:id', personagemFormaController.destroy);

export default router;