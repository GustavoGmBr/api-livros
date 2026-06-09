import prisma from '../lib/prisma.js';
import { sagaSchema } from '../validator/saga.validator.js';

const sagaController = {
  async index(req, res) {
    try {
      const sagas = await prisma.sagas.findMany({
        include: { _count: { select: { livros: true } } }
      });
      res.json(sagas);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async show(req, res) {
    try {
      const id = Number(req.params.id);
      const saga = await prisma.sagas.findUnique({
        where: { id },
        include: { livros: true }
      });
      if (!saga) {
        return res.status(404).json({ error: 'Saga não encontrada' });
      }
      res.json(saga);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async store(req, res) {
    try {
      const data = sagaSchema.parse(req.body);
      const saga = await prisma.sagas.create({ data });
      res.status(201).json(saga);
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
      const data = sagaSchema.parse(req.body);
      const saga = await prisma.sagas.update({
        where: { id },
        data
      });
      res.json(saga);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ errors: error.errors });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Saga não encontrada' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async destroy(req, res) {
    try {
      const id = Number(req.params.id);
      await prisma.sagas.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Saga não encontrada' });
      }
      res.status(500).json({ error: error.message });
    }
  }
};

export default sagaController;