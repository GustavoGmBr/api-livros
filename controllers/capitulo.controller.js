import prisma from '../lib/prisma.js';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import capituloSchema from '../validator/capitulo.validator.js';

const toJSON = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
));

const handleError = (error, res) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Erro de validação', errors: error.errors });
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') return res.status(404).json({ message: 'Registro não encontrado' });
  }
  console.error(error);
  return res.status(500).json({ message: 'Erro interno no servidor' });
};

const capituloController = {
  async listarPorLivro(req, res) {
    try {
      const { livroId } = req.params;
      const capitulos = await prisma.capitulos.findMany({
        where: {
          livro_id: Number(livroId),
          parent_id: null
        },
        include: {
          children: { orderBy: { numero: 'asc' } }
        },
        orderBy: { numero: 'asc' }
      });
      res.json(toJSON(capitulos));
    } catch (error) {
      handleError(error, res);
    }
  },

  async show(req, res) {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ message: 'ID não fornecido.' });

      let capitulo;
      if (!isNaN(Number(id))) {
        capitulo = await prisma.capitulos.findUnique({
          where: { id: Number(id) },
          include: {
            parent: true,
            children: { orderBy: { numero: 'asc' } }
          }
        });
      } else {
        capitulo = await prisma.capitulos.findFirst({
          where: { titulo: id },
          include: {
            parent: true,
            children: { orderBy: { numero: 'asc' } }
          }
        });
      }

      if (!capitulo) return res.status(404).json({ message: 'Capítulo não encontrado' });

      let personagensVinculados = [];
      if (capitulo.conteudo_json && Array.isArray(capitulo.conteudo_json)) {
        const idsPersonagens = [
          ...new Set(
            capitulo.conteudo_json
              .map(bloco => bloco.personagem_id || bloco.conteudo?.personagem_id)
              .filter(idObj => idObj && !isNaN(Number(idObj)))
              .map(idObj => Number(idObj))
          )
        ];

        if (idsPersonagens.length > 0) {
          personagensVinculados = await prisma.personagens.findMany({
            where: { id: { in: idsPersonagens } },
            select: { id: true, nome: true, imagemRosto: true }
          });
        }
      }

      res.json(toJSON({
        ...capitulo,
        personagens_detalhes: personagensVinculados
      }));
    } catch (error) {
      handleError(error, res);
    }
  },

  async store(req, res) {
    try {
      const data = capituloSchema.parse(req.body);
      const capitulo = await prisma.capitulos.create({ data });
      res.status(201).json(toJSON(capitulo));
    } catch (error) {
      handleError(error, res);
    }
  },

  async listarRecentes(req, res) {
    try {
      const capitulosRecentes = await prisma.capitulos.findMany({
        take: 3,
        orderBy: { id: 'desc' },
        include: {
          livros: {
            select: { titulo: true, data_publicacao: true }
          }
        }
      });

      const formatado = capitulosRecentes.map(cap => ({
        id: cap.id,
        titulo: cap.titulo,
        numero: cap.numero,
        livro: cap.livros?.titulo || "Crônica Isolada",
        data: cap.livros?.data_publicacao || null
      }));

      res.json(toJSON(formatado));
    } catch (error) {
      handleError(error, res);
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = capituloSchema.parse(req.body);
      const capitulo = await prisma.capitulos.update({
        where: { id: Number(id) },
        data,
      });
      res.json(toJSON(capitulo));
    } catch (error) {
      handleError(error, res);
    }
  },

  async updateConteudo(req, res) {
    try {
      const { id } = req.params;
      const { blocos } = req.body;
      const capitulo = await prisma.capitulos.update({
        where: { id: Number(id) },
        data: { conteudo_json: blocos }
      });
      res.json(toJSON(capitulo));
    } catch (error) {
      handleError(error, res);
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await prisma.capitulos.delete({ where: { id: Number(id) } });
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  },
};

export default capituloController;