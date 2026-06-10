import prisma from '../lib/prisma.js';
import ftpService from '../services/ftp.service.js';
import { personagemFormaSchema } from '../validator/personagemForma.validator.js';
import { ZodError } from 'zod';

const toJSON = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
));

const handleError = (error, res) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Erro de validação', errors: error.errors });
  }
  console.error('❌ Erro no PersonagemFormaController:', error);
  return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
};

const personagemFormaController = {
  async index(req, res) {
    try {
      const { personagem_id } = req.query;
      const formas = await prisma.personagem_forma.findMany({
        where: personagem_id ? { personagem_id: Number(personagem_id) } : {},
        include: {
          sistema: { select: { nome: true } },
          personagem: { select: { nome: true } }
        }
      });
      res.json(toJSON(formas));
    } catch (error) {
      handleError(error, res);
    }
  },

  async store(req, res) {
    try {
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
      handleError(error, res);
    }
  },

  async show(req, res) {
    try {
      const id = Number(req.params.id);
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
      handleError(error, res);
    }
  },


  async update(req, res) {
    try {
      const id = Number(req.params.id);
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
      handleError(error, res);
    }
  },

  async destroy(req, res) {
    try {
      const id = Number(req.params.id);
      await prisma.personagem_forma.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  }
};

export default personagemFormaController;