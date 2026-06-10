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
import personagemformapublic from './public/personagemForma.routes.js';
import personagemformaprivate from './private/personagemForma.routes.js';

// import sistemas
import sistemapublic from './public/sistema.routes.js';
import sistemaprivate from './private/sistema.routes.js';


const router = Router();

// 🔑 Autenticação - CORRIGIDO para /api/auth/login
// Removi o '/public' do caminho da URL, mas mantive o import da pasta public
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
router.use('/personagens/formas', personagemformapublic);
router.use('/private/personagens/formas', personagemformaprivate);

// 🖥️ Sistema
router.use('/sistemas', sistemapublic);
router.use('/private/sistemas', sistemaprivate);


export default router;