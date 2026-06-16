import { PrismaClient } from '@prisma/client';
import { itemSchema } from '../validator/itens.validator.js';
import { ZodError } from 'zod';

const prisma = new PrismaClient();

const itensController = {
  async index(req, res) {
    try {
      const itens = await prisma.itens.findMany({
        // Ajustado para 'createdAt' conforme o erro do seu Prisma indicou
        orderBy: { createdAt: 'desc' } 
      });
      return res.status(200).json(itens);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async show(req, res) {
    try {
      const item = await prisma.itens.findUnique({
        // Usando 'id_item' conforme seu schema atual (antes da migração de padronização)
        where: { id_item: Number(req.params.id) }
      });
      if (!item) return res.status(404).json({ error: 'Item not found' });
      return res.status(200).json(item);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  async store(req, res) {
    try {
      const data = itemSchema.parse(req.body);
      const item = await prisma.itens.create({ data });
      return res.status(201).json(item);
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json(error.errors);
      return res.status(500).json({ error: error.message });
    }
  },

  async update(req, res) {
    try {
      const data = itemSchema.parse(req.body);
      const item = await prisma.itens.update({
        where: { id_item: Number(req.params.id) },
        data
      });
      return res.status(200).json(item);
    } catch (error) {
      if (error instanceof ZodError) return res.status(400).json(error.errors);
      if (error.code === 'P2025') return res.status(404).json({ error: 'Item not found' });
      return res.status(500).json({ error: error.message });
    }
  },

  async destroy(req, res) {
    try {
      await prisma.itens.delete({
        where: { id_item: Number(req.params.id) }
      });
      return res.status(204).send();
    } catch (error) {
      if (error.code === 'P2025') return res.status(404).json({ error: 'Item not found' });
      return res.status(500).json({ error: error.message });
    }
  }
};

export default itensController;