import { Router } from 'express';

import authRoutes from './public/auth.routes.js';
// import saga
import sagapublic from './public/saga.routes.js';
import sagaprivate from './private/saga.routes.js';

// import saga
import livropublic from './public/livro.routes.js';
import livroprivate from './private/livro.routes.js';

// import capitulos
import capitulopublic from './public/capitulo.routes.js';
import capituloprivate from './private/capitulo.routes.js';

// import locais
import locaisPublic from './public/locais.routes.js';
import locaisPrivate from './private/locais.routes.js';

// import itens
import itensPublic from './public/itens.routes.js';
import itensPrivate from './private/itens.routes.js';

// import personagem
import personagempublic from './public/personagem.routes.js';
import personagemprivate from './private/personagem.routes.js';

// import personagem Forma
import formapublic from './public/personagemForma.routes.js';
import formaprivate from './private/personagemForma.routes.js';

// import Racas
import historicoPublic from './public/historico.routes.js';
import historicoPrivate from './private/historico.routes.js';

// import Racas
import racaspublic from './public/racas.routes.js';
import racasprivate from './private/racas.routes.js';

// import sistemas
import sistemapublic from './public/sistema.routes.js';
import sistemaprivate from './private/sistema.routes.js';

// import Racas
import inventariopublic from './public/inventario.routes.js';
import inventarioprivate from './private/inventario.routes.js';

// 🐲 import Bestiario
import bestiariopublic from './public/bestiario.routes.js';
import bestiarioprivate from './private/bestiario.routes.js';
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

// 📍 Locais
router.use('/locais', locaisPublic);
router.use('/private/locais', locaisPrivate)

// 🤴 Raças
router.use('/racas', racaspublic);
router.use('/private/racas', racasprivate);

// 🧑 personagem
router.use('/personagens', personagempublic);
router.use('/private/personagens', personagemprivate);

// ⏱️ Historico
router.use('/historicos', historicoPublic);
router.use('/private/historicos', historicoPrivate);

// ⚔️ itens
router.use('/itens', itensPublic);
router.use('/private/itens', itensPrivate);

// 🤴 personagem Forma
router.use('/formas', formapublic);
router.use('/private/formas', formaprivate);

// 🖥️ Sistema
router.use('/sistemas', sistemapublic);
router.use('/private/sistemas', sistemaprivate);

// 🖥️ inventario
router.use('/inventarios', inventariopublic);
router.use('/private/inventarios', inventarioprivate);

// 🐲 Bestiário
router.use('/bestiario', bestiariopublic);
router.use('/private/bestiario', bestiarioprivate)

export default router;