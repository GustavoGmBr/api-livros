import { Router } from 'express';
import personagemFormaController from '../../controllers/personagemForma.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
// 🚀 Alterado para importar o middleware específico que configuramos juntos
import { uploadFormaEspecial } from '../../middlewares/upload.js';

const router = Router();

// Todas as rotas abaixo exigem autenticação
router.use(authMiddleware);

// Criar nova forma com upload de imagens (corpo e rosto)
router.post('/', 
  uploadFormaEspecial, 
  personagemFormaController.store
);

// Atualizar forma existente com upload opcional
router.put('/:id', 
  uploadFormaEspecial, 
  personagemFormaController.update
);

// Deletar forma
router.delete('/:id', personagemFormaController.destroy);

export default router;