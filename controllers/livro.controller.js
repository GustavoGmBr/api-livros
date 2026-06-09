import prisma from '../lib/prisma.js';
import { livroSchema } from '../validator/livro.validator.js';

const livroController = {
  async index(req, res) {
    try {
      const { saga_id } = req.query;
      const livros = await prisma.livros.findMany({
        where: saga_id ? { saga_id: Number(saga_id) } : {},
        include: {
          saga: { select: { nome: true } },
          _count: { select: { capitulos: true } }
        }
      });
      res.json(livros);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async show(req, res) {
    try {
      const id = Number(req.params.id);
      const livro = await prisma.livros.findUnique({
        where: { id },
        include: {
          saga: true,
          capitulos: {
            orderBy: { numero: 'asc' },
            select: { id: true, numero: true, titulo: true }
          }
        }
      });
      if (!livro) {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }
      res.json(livro);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  async store(req, res) {
    try {
      const data = livroSchema.parse(req.body);
      const livro = await prisma.livros.create({ data });
      res.status(201).json(livro);
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
      const data = livroSchema.parse(req.body);
      const livro = await prisma.livros.update({
        where: { id },
        data
      });
      res.json(livro);
    } catch (error) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ errors: error.errors });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async destroy(req, res) {
    try {
      const id = Number(req.params.id);
      await prisma.livros.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Livro não encontrado' });
      }
      res.status(500).json({ error: error.message });
    }
  }
};

export default livroController;