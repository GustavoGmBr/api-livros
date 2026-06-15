import prisma from '../lib/prisma.js';
import { localSchema } from '../validator/locais.validator.js';

// FUNÇÃO ATUALIZADA: Transforma criado_em (banco) em criadoEm (padrão camelCase do React)
const formatarLocal = (local) => {
  if (!local) return null;
  const { criado_em, ...resto } = local;
  return {
    ...resto,
    criadoEm: criado_em // 👈 Corrigido aqui para remover o underline!
  };
};

const locaisController = {
  async index(req, res) {
    try {
      const locais = await prisma.locais.findMany({
        orderBy: { criado_em: 'desc' } // Perfeito, batendo com o banco!
      });
      
      res.json(locais.map(formatarLocal));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async show(req, res) {
    try {
      const id = Number(req.params.id);
      const local = await prisma.locais.findUnique({ where: { id } });
      
      if (!local) {
        return res.status(404).json({ error: 'Local não encontrado' });
      }
      
      res.json(formatarLocal(local));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async store(req, res) {
    try {
      const data = localSchema.parse(req.body);
      const local = await prisma.locais.create({ data });
      
      res.status(201).json(formatarLocal(local));
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ errors: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const data = localSchema.parse(req.body);
      
      const local = await prisma.locais.update({
        where: { id },
        data
      });
      
      res.json(formatarLocal(local));
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ errors: error.errors });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Local não encontrado' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async destroy(req, res) {
    try {
      const id = Number(req.params.id);
      await prisma.locais.delete({ where: { id } });
      
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Local não encontrado' });
      }
      res.status(500).json({ error: error.message });
    }
  }
};

export default locaisController;