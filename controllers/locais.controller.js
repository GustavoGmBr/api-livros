import { PrismaClient } from '@prisma/client';
import { localSchema } from '../validator/locais.validator.js';
import { ZodError } from 'zod';

const prisma = new PrismaClient();

const locaisController = {
  async index(req, res) {
    try {
      const locais = await prisma.locais.findMany({
        orderBy: { criado_em: 'desc' }
      });
      return res.status(200).json(locais);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async show(req, res) {
    try {
      const local = await prisma.locais.findUnique({
        where: { id: Number(req.params.id) }
      });
      if (!local) return res.status(404).json({ error: 'Local not found' });
      return res.status(200).json(local);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async store(req, res) {
    try {
      const data = localSchema.parse(req.body);
      const local = await prisma.locais.create({ data });
      return res.status(201).json(local);
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json(error.errors);
      return res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const data = localSchema.parse(req.body);
      const local = await prisma.locais.update({
        where: { id: Number(req.params.id) },
        data
      });
      return res.status(200).json(local);
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json(error.errors);
      if (error.code === 'P2025') return res.status(404).json({ error: 'Local not found' });
      return res.status(500).json({ error: error.message });
    }
  },

  async destroy(req, res) {
    try {
      await prisma.locais.delete({
        where: { id: Number(req.params.id) }
      });
      return res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Local not found' });
      return res.status(500).json({ error: error.message });
    }
  }
};

export default locaisController;