import { Router } from 'express';
import livroController from '../../controllers/livro.controller.js';
import authMiddleware from '../../middlewares/auth.middleware.js';
import { uploadLivro } from '../../middlewares/upload.js'; // ✅ IMPORTAR CORRETAMENTE

const router = Router();

// Todas as rotas de escrita/exclusão exigem autenticação
router.use(authMiddleware);

// Rotas públicas (GET)
router.get('/', livroController.index);
router.get('/:id', livroController.show);

// Rotas com upload de capa
router.post('/', 
  uploadLivro, // Usar o upload específico para livros
  livroController.store
);

router.put('/:id', 
  uploadLivro, // Usar o upload específico para livros
  livroController.update
);

// Rota para remover apenas a capa (opcional)
router.delete('/:id/capa', livroController.removeCapa);

// Rota para deletar o livro completo
router.delete('/:id', livroController.destroy);

export default router;