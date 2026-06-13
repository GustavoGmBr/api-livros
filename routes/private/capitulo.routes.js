import { Router } from 'express';
import capituloController from '../../controllers/capitulo.controller.js';

const router = Router();

// Criar um novo capítulo/subcapítulo
router.post('/', capituloController.store);

// Atualizar o esqueleto/dados cadastrais de um capítulo
router.put('/:id', capituloController.update);

// Atualizar apenas o conteúdo síncrono (JSON) do Grimório
router.patch('/:id/conteudo', capituloController.updateConteudo);

// Limpar as páginas e participantes (esvaziar o conteúdo JSON), mantendo o esqueleto
router.patch('/:id/limpar-conteudo', capituloController.destroyConteudo);

// Deletar completamente um capítulo (e seus subcapítulos via Cascade)
router.delete('/:id', capituloController.destroy);

export default router;