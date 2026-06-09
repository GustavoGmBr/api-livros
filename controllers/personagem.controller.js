    import { prisma } from '../lib/prisma.js';
import ftpService from '../services/ftp.service.js';
import { personagemSchema } from '../validator/personagem.validator.js';
import { ZodError } from 'zod';

// Utilitário para BigInt e Datas
const toJSON = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
));

const handleError = (error, res) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Erro de validação', errors: error.errors });
  }
  console.error('❌ Erro no PersonagemController:', error);
  return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
};

const personagemController = {
  async index(req, res) {
    try {
      const personagens = await prisma.personagens.findMany({
        select: {
          id: true,
          nome: true,
          mundo_origem: true, // 👈 Force a seleção aqui
          afiliacao: true,
          // ... adicione os outros campos que você precisa na tabela
          historicos: {
            orderBy: { criado_em: 'desc' },
            take: 1,
            include: { raca: true }
          }
        },
        orderBy: { nome: 'asc' }
      });
      console.log("💎 Bruto do Prisma:", personagens[1]); // Veja se mundo_origem aparece aqui
      res.json(toJSON(personagens));
    } catch (error) {
      handleError(error, res);
    }
  },

  async store(req, res) {
    try {
      // Validação dos dados textuais
      const dadosValidados = personagemSchema.parse(req.body);
      const files = req.files;

      let urlCorpo = null;
      let urlRosto = null;

      if (files) {
        const nomeLimpo = dadosValidados.nome.replace(/\s+/g, '_');
        if (files.corpo) {
          urlCorpo = await ftpService.uploadFile(files.corpo[0], 'personagens', `${nomeLimpo}_Corpo`);
        }
        if (files.rosto) {
          urlRosto = await ftpService.uploadFile(files.rosto[0], 'personagens', `${nomeLimpo}_Rosto`);
        }
      }

      const novoPersonagem = await prisma.personagens.create({
        data: {
          ...dadosValidados,
          imagemCorpo: urlCorpo,
          imagemRosto: urlRosto
        }
      });

      res.status(201).json(toJSON(novoPersonagem));
    } catch (error) {
      handleError(error, res);
    }
  },

  async show(req, res) {
    try {
      const { id } = req.params;
      const personagem = await prisma.personagens.findUnique({
        where: { id: Number(id) },
        include: {
          historicos: {
            orderBy: { criado_em: 'desc' },
            take: 1,
            include: { raca: true }
          }
          // Formas removidas conforme solicitado
        }
      });

      if (!personagem) return res.status(404).json({ error: 'Personagem não encontrado' });
      res.json(toJSON(personagem));
    } catch (error) {
      handleError(error, res);
    }
  },

  async buscarParaLeitura(req, res) {
    try {
      const { id, capituloId } = req.params;

      const personagem = await prisma.personagens.findUnique({
        where: { id: Number(id) },
        include: {
          historicos: {
            where: { capitulo_id: Number(capituloId) },
            include: { raca: true }
          }
        }
      });

      if (!personagem) return res.status(404).json({ error: 'Personagem não encontrado para este capítulo' });
      res.json(toJSON(personagem));
    } catch (error) {
      handleError(error, res);
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const dadosValidados = personagemSchema.parse(req.body);
      const files = req.files;

      const atual = await prisma.personagens.findUnique({ where: { id: Number(id) } });
      if (!atual) return res.status(404).json({ error: "Personagem não encontrado" });

      let urlCorpo = atual.imagemCorpo;
      let urlRosto = atual.imagemRosto;

      if (files) {
        const nomeLimpo = (dadosValidados.nome || atual.nome).replace(/\s+/g, '_');
        if (files.corpo) {
          urlCorpo = await ftpService.uploadFile(files.corpo[0], 'personagens', `${nomeLimpo}_Corpo`);
        }
        if (files.rosto) {
          urlRosto = await ftpService.uploadFile(files.rosto[0], 'personagens', `${nomeLimpo}_Rosto`);
        }
      }

      const atualizado = await prisma.personagens.update({
        where: { id: Number(id) },
        data: {
          ...dadosValidados,
          imagemCorpo: urlCorpo,
          imagemRosto: urlRosto
        }
      });

      res.json(toJSON(atualizado));
    } catch (error) {
      handleError(error, res);
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await prisma.personagens.delete({ where: { id: Number(id) } });
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  }
};

export default personagemController;