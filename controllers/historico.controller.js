import prisma from '../lib/prisma.js';
import { historicoSchema } from '../validator/historico.validator.js';
import { ZodError } from 'zod';

const store = async (req, res) => {
  try {
    // 'rest' contém: equipamento, habilidades, elementos, formas_desbloqueadas, etc.
    const { inventario, ...rest } = historicoSchema.parse(req.body);

    const historico = await prisma.personagem_historico.create({
      data: {
        ...rest,
        // O Prisma grava arrays/objetos diretamente como JSON
        // E injeta a lista de inventário mapeada na tabela relacional
        inventario: {
          create: inventario && inventario.length > 0 ? inventario : []
        }
      },
      include: { 
        inventario: true 
      }
    });

    return res.status(201).json(historico);
  } catch (error) {
    handleErrors(res, error, "store");
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const historicoId = Number(id);

  try {
    const { inventario, ...rest } = historicoSchema.parse(req.body);

    const historico = await prisma.$transaction(async (tx) => {
      // 1. Limpa o inventário antigo ligado a este histórico
      await tx.inventarios.deleteMany({
        where: { historico_id: historicoId }
      });

      // 2. Atualiza os dados do histórico e recria os itens do inventário de uma vez
      return await tx.personagem_historico.update({
        where: { id: historicoId },
        data: {
          ...rest,
          inventario: {
            create: inventario && inventario.length > 0 ? inventario : []
          }
        },
        include: { 
          inventario: true 
        }
      });
    });

    return res.json(historico);
  } catch (error) {
    handleErrors(res, error, "update");
  }
};

const show = async (req, res) => {
  const { id } = req.params;
  try {
    const historico = await prisma.personagem_historico.findUnique({
      where: { id: Number(id) },
      include: {
        raca: true,
        livro: true,
        capitulo: true,
        inventario: {
          include: { itens: true }
        }
      }
    });
    
    if (!historico) return res.status(404).json({ error: 'Registro não encontrado' });
    return res.json(historico);
  } catch (error) {
    handleErrors(res, error, "show");
  }
};

const timeline = async (req, res) => {
  const { personagemId } = req.params;
  try {
    const historicos = await prisma.personagem_historico.findMany({
      where: { personagem_id: Number(personagemId) },
      include: {
        raca: true,
        livro: { select: { titulo: true } },
        capitulo: { select: { numero: true, titulo: true } },
        inventario: {
          include: { itens: { select: { nome: true } } }
        }
      },
      orderBy: { criado_em: 'desc' }
    });
    return res.json(historicos);
  } catch (error) {
    handleErrors(res, error, "timeline");
  }
};

const destroy = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.personagem_historico.delete({
      where: { id: Number(id) }
    });
    return res.status(204).send();
  } catch (error) {
    handleErrors(res, error, "destroy");
  }
};

function handleErrors(res, error, context) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: "Erro de validação", detalhes: error.errors });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }
  console.error(`❌ Erro Prisma (${context}):`, error);
  return res.status(500).json({ error: `Erro interno no servidor (${context})` });
}

export default { store, update, show, destroy, timeline };