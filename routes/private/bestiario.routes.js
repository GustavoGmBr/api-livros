// backend/routes/bestiario.routes.js

import { Router } from 'express';
import bestiarioController from '../controllers/bestiario.controller.js';
import { uploadBestiario } from '../middlewares/upload.middleware.js';

const router = Router();

// 🔥 A rota deve usar o uploadBestiario
router.post('/bestiario', uploadBestiario, bestiarioController.store);
router.put('/bestiario/:id', uploadBestiario, bestiarioController.update);
router.get('/bestiario', bestiarioController.index);
router.get('/bestiario/:id', bestiarioController.show);
router.delete('/bestiario/:id', bestiarioController.destroy);

export default router;