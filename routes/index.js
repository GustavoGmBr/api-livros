import { Router } from 'express';

import authRoutes from './public/auth.routes.js';
// import saga
import sagapublic from './public/saga.routes.js';
import sagaprivate from './private/saga.routes.js';

// import saga
import livropublic from './public/livro.routes.js';
import livroprivate from './private/livro.routes.js';

// import saga
import capitulopublic from './public/capitulo.routes.js';
import capituloprivate from './private/capitulo.routes.js';

// import personagem
import personagempublic from './public/personagem.routes.js';
import personagemprivate from './private/personagem.routes.js';

// import personagem Forma
import formapublic from './public/personagemForma.routes.js';
import formaprivate from './private/personagemForma.routes.js';

// import sistemas
import sistemapublic from './public/sistema.routes.js';
import sistemaprivate from './private/sistema.routes.js';


const router = Router();

router.use('/auth', authRoutes);


// 📕 Sagas
router.use('/sagas', sagapublic);
router.use('/private/sagas', sagaprivate);

// 📖 Livros
router.use('/livros', livropublic);
router.use('/private/livros', livroprivate);

// 📖 Capitulos
router.use('/capitulos', capitulopublic);
router.use('/private/capitulos', capituloprivate);


// 🧑 personagem
router.use('/personagens', personagempublic);
router.use('/private/personagens', personagemprivate);

// 🤴 personagem Forma
router.use('/formas', formapublic);
router.use('/private/formas', formaprivate);

// 🖥️ Sistema
router.use('/sistemas', sistemapublic);
router.use('/private/sistemas', sistemaprivate);


export default router;