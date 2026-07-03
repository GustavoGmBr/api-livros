import prisma from '../lib/prisma.js';
import { historicoSchema } from '../validator/historico.validator.js';
import { ZodError } from 'zod';

const store = async (req, res) => {
  try {
    // Parse e validação dos dados
    const validatedData = historicoSchema.parse(req.body);
    
    // 🔥 EXTRAIR campos que não são do modelo principal
    const { inventario, formas_desbloqueadas, ...rest } = validatedData;

    // 🔥 REMOVER qualquer raca_id que possa ter vindo no rest
    delete rest.raca_id;

    // 🔥 PREPARAR dados para o Prisma
    const dataToSave = {
      ...rest,
      // 🔥 Garantir que formas_desbloqueadas seja um array válido ou null
      formas_desbloqueadas: formas_desbloqueadas && formas_desbloqueadas.length > 0 
        ? formas_desbloqueadas 
        : null
    };

    console.log('📦 Dados a serem salvos:', JSON.stringify(dataToSave, null, 2));

    const historico = await prisma.personagem_historico.create({
      data: dataToSave,
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
    console.error('❌ Erro no store:', error);
    handleErrors(res, error, "store");
  }
};

const update = async (req, res) => {
  const { id } = req.params;
  const historicoId = Number(id);

  try {
    const validatedData = historicoSchema.parse(req.body);
    
    const { inventario, formas_desbloqueadas, ...rest } = validatedData;

    // 🔥 REMOVER qualquer raca_id que possa ter vindo no rest
    delete rest.raca_id;

    const dataToSave = {
      ...rest,
      formas_desbloqueadas: formas_desbloqueadas && formas_desbloqueadas.length > 0 
        ? formas_desbloqueadas 
        : null
    };

    const historico = await prisma.personagem_historico.update({
      where: { id: historicoId },
      data: dataToSave,
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
    console.error('❌ Erro no update:', error);
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
      where: { personagem_id: Number(personajeId) },
      include: {
        raca: true,
        livro: { select: { titulo: true } },
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
    console.error('❌ Erro de validação Zod:', JSON.stringify(error.errors, null, 2));
    return res.status(400).json({ 
      error: "Erro de validação", 
      detalhes: error.errors 
    });
  }
  
  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado' });
  }
  
  if (error.code === 'P2002') {
    return res.status(409).json({ error: 'Conflito: Registro duplicado' });
  }

  if (error.code === 'P2003') {
    return res.status(400).json({ 
      error: 'Erro de chave estrangeira',
      message: error.message,
      field: error.meta?.field_name || 'campo desconhecido'
    });
  }
  
  console.error(`❌ Erro Prisma (${context}):`, error);
  return res.status(500).json({ 
    error: `Erro interno no servidor (${context})`,
    message: error.message || 'Erro desconhecido'
  });
}

export default { store, update, show, destroy, timeline };