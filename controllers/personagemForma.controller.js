import prisma from '../lib/prisma.js';
import ftpService from '../services/ftp.service.js';
import { personagemFormaSchema } from '../validator/personagemForma.validator.js';
import { ZodError } from 'zod';

const toJSON = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
));

const handleError = (error, res, req) => {
  if (req) res.setHeader('X-Rota-Acessada', req.originalUrl);

  if (error instanceof ZodError) {
    console.log('\n❌ [ZOD VALIDATION ERROR] O Backend rejeitou os dados enviados:');
    console.dir(error.errors, { depth: null }); 
    console.log('-------------------------------------------------------------\n');

    return res.status(400).json({ 
      message: 'Erro de validação nos campos do formulário', 
      errors: error.errors 
    });
  }

  console.error('❌ Erro crítico no PersonagemFormaController:', error);
  return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
};

const personagemFormaController = {
  async index(req, res) {
    try {
      res.setHeader('X-Rota-Acessada', req.originalUrl);

      const { personagem_id } = req.query;
      
      const queryWhere = {};
      if (personagem_id && !isNaN(personagem_id)) {
        queryWhere.personagem_id = Number(personagem_id);
      }

      // Busca apenas as formas, sem relações (pois o schema não tem sistema_id)
      const formas = await prisma.personagem_forma.findMany({
        where: queryWhere,
        include: {
          personagem: { 
            select: { 
              id: true, 
              nome: true 
            } 
          }
        },
        orderBy: {
          nome: 'asc'
        }
      });

      const formasFormatadas = formas.map(forma => ({
        ...forma,
        personagem_nome: forma.personagem?.nome || 'Não Vinculado'
      }));

      res.json(toJSON(formasFormatadas));
    } catch (error) {
      console.warn('⚠️ Falha na busca. Tentando fallback seguro:', error.message);
      try {
        // Fallback limpo sem relações
        const formasFallback = await prisma.personagem_forma.findMany({
          where: req.query.personagem_id ? { personagem_id: Number(req.query.personagem_id) } : {},
          orderBy: {
            nome: 'asc'
          }
        });
        return res.json(toJSON(formasFallback));
      } catch (fallbackError) {
        handleError(fallbackError, res, req);
      }
    }
  },

  async store(req, res) {
    try {
      res.setHeader('X-Rota-Acessada', req.originalUrl);
      console.log('📥 req.body recebido no store:', req.body);

      const data = personagemFormaSchema.parse(req.body);
      const files = req.files;

      let urlCorpo = null;
      let urlRosto = null;

      if (files) {
        const nomeLimpo = data.nome.replace(/\s+/g, '_');
        if (files.corpo && files.corpo[0]) {
          urlCorpo = await ftpService.uploadFile(files.corpo[0], 'formas', `${nomeLimpo}_corpo`);
        }
        if (files.rosto && files.rosto[0]) {
          urlRosto = await ftpService.uploadFile(files.rosto[0], 'formas', `${nomeLimpo}_rosto`);
        }
      }

      // Remove campos que não existem no schema
      const { imagemCorpo, imagemRosto, ...payloadDados } = data;

      const novaForma = await prisma.personagem_forma.create({
        data: {
          ...payloadDados,
          imagemCorpo: urlCorpo,
          imagemRosto: urlRosto
        }
      });

      res.status(201).json(toJSON(novaForma));
    } catch (error) {
      handleError(error, res, req);
    }
  },

  async show(req, res) {
    try {
      res.setHeader('X-Rota-Acessada', req.originalUrl);
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido fornecido.' });

      const forma = await prisma.personagem_forma.findUnique({
        where: { id },
        include: {
          personagem: { 
            select: { 
              id: true, 
              nome: true 
            } 
          }
        }
      });

      if (!forma) return res.status(404).json({ error: 'Forma não encontrada' });
      
      const formaFormatada = {
        ...forma,
        personagem_nome: forma.personagem?.nome || 'Não Vinculado'
      };
      
      res.json(toJSON(formaFormatada));
    } catch (error) {
      handleError(error, res, req);
    }
  },

  async update(req, res) {
    try {
      res.setHeader('X-Rota-Acessada', req.originalUrl);
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido para atualização.' });

      console.log('📥 req.body recebido no update:', req.body);

      const data = personagemFormaSchema.parse(req.body);
      const files = req.files;

      const atual = await prisma.personagem_forma.findUnique({ where: { id } });
      if (!atual) return res.status(404).json({ error: "Forma não encontrada" });

      let urlCorpo = data.imagemCorpo === null ? null : atual.imagemCorpo;
      let urlRosto = data.imagemRosto === null ? null : atual.imagemRosto;

      if (files) {
        const nomeLimpo = (data.nome || atual.nome).replace(/\s+/g, '_');
        
        if (files.corpo && files.corpo[0]) {
          if (atual.imagemCorpo) await ftpService.deleteFile(atual.imagemCorpo);
          urlCorpo = await ftpService.uploadFile(files.corpo[0], 'formas', `${nomeLimpo}_corpo`);
        }
        
        if (files.rosto && files.rosto[0]) {
          if (atual.imagemRosto) await ftpService.deleteFile(atual.imagemRosto);
          urlRosto = await ftpService.uploadFile(files.rosto[0], 'formas', `${nomeLimpo}_rosto`);
        }
      }

      const { imagemCorpo, imagemRosto, ...payloadDados } = data;

      const atualizada = await prisma.personagem_forma.update({
        where: { id },
        data: {
          ...payloadDados,
          imagemCorpo: urlCorpo,
          imagemRosto: urlRosto
        }
      });

      res.json(toJSON(atualizada));
    } catch (error) {
      handleError(error, res, req);
    }
  },

  async destroy(req, res) {
    try {
      res.setHeader('X-Rota-Acessada', req.originalUrl);
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido para exclusão.' });

      const forma = await prisma.personagem_forma.findUnique({ where: { id } });
      if (forma) {
        if (forma.imagemCorpo) await ftpService.deleteFile(forma.imagemCorpo);
        if (forma.imagemRosto) await ftpService.deleteFile(forma.imagemRosto);
      }

      await prisma.personagem_forma.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      handleError(error, res, req);
    }
  }
};

export default personagemFormaController;