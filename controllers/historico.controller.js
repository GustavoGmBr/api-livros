import prisma from '../lib/prisma.js';
import { historicoSchema } from '../validator/historico.validator.js';
import { ZodError } from 'zod';

const store = async (req, res) => {
  try {
    // Como o inventário agora pertence ao capítulo, removemos a inserção cascata aqui
    const { inventario, ...rest } = historicoSchema.parse(req.body);

    const historico = await prisma.personagem_historico.create({
      data: {
        ...rest
      },
      include: { 
        raca: true,
        livro: true,
        capitulo: {
          include: {
            inventarios: {
              include: { itens: true }
            }
          }
        }
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

    // Não precisamos mais de transação para apagar/recriar inventário aqui,
    // pois o inventário agora é gerenciado pelo controller de inventários/capítulos.
    const historico = await prisma.personagem_historico.update({
      where: { id: historicoId },
      data: {
        ...rest
      },
      include: { 
        raca: true,
        livro: true,
        capitulo: {
          include: {
            inventarios: {
              include: { itens: true }
            }
          }
        }
      }
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
        // ✅ CORREÇÃO: O inventário agora é puxado de dentro de capitulo usando o plural correto (inventarios)
        capitulo: {
          include: {
            inventarios: {
              include: { itens: true }
            }
          }
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
  const { personajeId } = req.params;
  try {
    const historicos = await prisma.personagem_historico.findMany({
      where: { personaje_id: Number(personagemId) },
      include: {
        raca: true,
        livro: { select: { titulo: true } },
        // ✅ CORREÇÃO: Buscando os itens do inventário vinculados ao capítulo atual do histórico
        capitulo: {
          select: { 
            numero: true, 
            titulo: true,
            inventarios: {
              include: {
                itens: { select: { nome: true } }
              }
            }
          } 
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