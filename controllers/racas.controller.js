import prisma from '../lib/prisma.js';
import { racasSchema } from '../validator/racas.validator.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

const toJSON = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
));

const handleError = (error, res) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Erro de validação', errors: error.errors });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Raça não encontrada' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Erro interno no servidor' });
};

const racasController = {
  async index(req, res) {
    try {
      const racas = await prisma.racas.findMany({
        include: { sistema: { select: { nome: true } } },
        orderBy: { nome: 'asc' }
      });
      res.json(toJSON(racas));
    } catch (error) {
      handleError(error, res);
    }
  },

  async show(req, res) {
    try {
      const id = Number(req.params.id);
      const raca = await prisma.racas.findUnique({
        where: { id },
        include: { sistema: true }
      });
      if (!raca) return res.status(404).json({ message: 'Raça não encontrada' });
      res.json(toJSON(raca));
    } catch (error) {
      handleError(error, res);
    }
  },

  async store(req, res) {
    try {
      const data = racasSchema.parse(req.body);
      const raca = await prisma.racas.create({ data });
      res.status(201).json(toJSON(raca));
    } catch (error) {
      handleError(error, res);
    }
  },

  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const data = racasSchema.parse(req.body);
      const raca = await prisma.racas.update({
        where: { id },
        data
      });
      res.json(toJSON(raca));
    } catch (error) {
      handleError(error, res);
    }
  },

  async destroy(req, res) {
    try {
      const id = Number(req.params.id);
      await prisma.racas.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  }
};

export default racasController;