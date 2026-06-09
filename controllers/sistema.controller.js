    import { prisma } from '../lib/prisma.js';
import { sistemaSchema } from '../validator/sistema.validator.js';

const sistemaController = {
  async index(req, res) {
    try {
      const sistemas = await prisma.sistemas.findMany();
      res.json(sistemas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async show(req, res) {
    try {
      const id = Number(req.params.id);
      const sistema = await prisma.sistemas.findUnique({ where: { id } });
      if (!sistema) {
        return res.status(404).json({ error: 'Sistema not found' });
      }
      res.json(sistema);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async store(req, res) {
    try {
      const data = sistemaSchema.parse(req.body);
      const sistema = await prisma.sistemas.create({ data });
      res.status(201).json(sistema);
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
      const data = sistemaSchema.parse(req.body);
      const sistema = await prisma.sistemas.update({
        where: { id },
        data
      });
      res.json(sistema);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ errors: error.errors });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Sistema not found' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async destroy(req, res) {
    try {
      const id = Number(req.params.id);
      await prisma.sistemas.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Sistema not found' });
      }
      res.status(500).json({ error: error.message });
    }
  }
};

export default sistemaController;
