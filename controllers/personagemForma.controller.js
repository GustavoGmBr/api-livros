import prisma from '../lib/prisma.js';
import ftpService from '../services/ftp.service.js';
import { personagemFormaSchema } from '../validator/personagemForma.validator.js';
import { ZodError } from 'zod';

// Voltamos o toJSON ao que era antes (sem envelopar) para não quebrar seu hook
const toJSON = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
));

const handleError = (error, res, req) => {
  // Envia a rota no Header de erro também
  if (req) res.setHeader('X-Rota-Acessada', req.originalUrl);

  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Erro de validação', errors: error.errors });
  }
  console.error('❌ Erro no PersonagemFormaController:', error);
  return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
};

const personagemFormaController = {
  async index(req, res) {
    try {
      // 🚀 Injeta a rota no Header da resposta para você testar/ver no Network do navegador
      res.setHeader('X-Rota-Acessada', req.originalUrl);

      const { personagem_id } = req.query;
      
      const queryWhere = {};
      if (personagem_id && !isNaN(personagem_id)) {
        queryWhere.personagem_id = Number(personagem_id);
      }

      const formas = await prisma.personagem_forma.findMany({
        where: queryWhere,
        include: {
          sistema: { select: { nome: true } },
          personagem: { select: { nome: true } }
        }
      });

      const formasFormatadas = formas.map(forma => ({
        ...forma,
        personagem_nome: forma.personagem?.nome || 'Não Vinculado',
        sistema_nome: forma.sistema?.nome || 'Nenhum'
      }));

      // Retorna o Array puro, exatamente como seu hook espera!
      res.json(toJSON(formasFormatadas));
    } catch (error) {
      console.warn('⚠️ Falha no include automático. Tentando fallback seguro sem relações...');
      try {
        const formasFallback = await prisma.personagem_forma.findMany({
          where: req.query.personagem_id ? { personagem_id: Number(req.query.personagem_id) } : {}
        });
        return res.json(toJSON(formasFallback));
      } catch (fallbackError) {
        handleError(error, res, req);
      }
    }
  },

  async store(req, res) {
    try {
      res.setHeader('X-Rota-Acessada', req.originalUrl);
      const data = personagemFormaSchema.parse(req.body);
      const files = req.files;

      let urlCorpo = null;
      let urlRosto = null;

      if (files) {
        const nomeLimpo = data.nome.replace(/\s+/g, '_');
        if (files.corpo) {
          urlCorpo = await ftpService.uploadFile(files.corpo[0], 'formas', `${nomeLimpo}_Corpo`);
        }
        if (files.rosto) {
          urlRosto = await ftpService.uploadFile(files.rosto[0], 'formas', `${nomeLimpo}_Rosto`);
        }
      }

      const novaForma = await prisma.personagem_forma.create({
        data: {
          ...data,
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
          sistema: true,
          personagem: { select: { nome: true } }
        }
      });

      if (!forma) return res.status(404).json({ error: 'Forma não encontrada' });
      res.json(toJSON(forma));
    } catch (error) {
      handleError(error, res, req);
    }
  },

  async update(req, res) {
    try {
      res.setHeader('X-Rota-Acessada', req.originalUrl);
      const id = Number(req.params.id);
      if (isNaN(id)) return res.status(400).json({ error: 'ID inválido para atualização.' });

      const data = personagemFormaSchema.parse(req.body);
      const files = req.files;

      const atual = await prisma.personagem_forma.findUnique({ where: { id } });
      if (!atual) return res.status(404).json({ error: "Forma não encontrada" });

      let urlCorpo = atual.imagemCorpo;
      let urlRosto = atual.imagemRosto;

      if (files) {
        const nomeLimpo = (data.nome || atual.nome).replace(/\s+/g, '_');
        if (files.corpo) {
          urlCorpo = await ftpService.uploadFile(files.corpo[0], 'formas', `${nomeLimpo}_Corpo`);
        }
        if (files.rosto) {
          urlRosto = await ftpService.uploadFile(files.rosto[0], 'formas', `${nomeLimpo}_Rosto`);
        }
      }

      const atualizada = await prisma.personagem_forma.update({
        where: { id },
        data: {
          ...data,
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

      await prisma.personagem_forma.delete({ where: { id } });
      
      // Pode voltar para o 204 original se o front-end não precisa ler o corpo!
      res.status(204).send();
    } catch (error) {
      handleError(error, res, req);
    }
  }
};

export default personagemFormaController;