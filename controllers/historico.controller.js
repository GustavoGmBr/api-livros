// controllers/historico.controller.js
import prisma from '../lib/prisma.js';
import { historicoSchema } from '../validator/historico.validator.js';
import { ZodError } from 'zod';

// 🔥 Função para sanitizar dados antes de salvar
const sanitizeHistoricoData = (data) => {
  const { inventario, ...rest } = data;

  // Sanitiza formas_desbloqueadas
  if (rest.formas_desbloqueadas && Array.isArray(rest.formas_desbloqueadas)) {
    rest.formas_desbloqueadas = rest.formas_desbloqueadas
      .filter(forma => forma.forma_id)
      .map((forma) => ({
        forma_id: Number(forma.forma_id),
        subnivel: Math.min(Math.max(Number(forma.subnivel) || 1, 1), 5),
        pcForma: Number(forma.pcForma) || 0,
        bonusPC: Number(forma.bonusPC) || 0,
        bonusAetheris: Number(forma.bonusAetheris) || 0,
        ranque: forma.ranque || null
      }));
  } else {
    rest.formas_desbloqueadas = null;
  }

  // Garante que campos numéricos sejam números
  const numericFields = ['subnivel', 'nivel', 'xpAtual', 'xpProximo',
    'qtd_treino', 'ponto_combate', 'ponto_combateAetheris',
    'bonusPCErion'];

  numericFields.forEach(field => {
    if (rest[field] !== undefined && rest[field] !== null) {
      rest[field] = Number(rest[field]) || 0;
    }
  });

  // Trata campos JSON
  const jsonFields = ['elementos', 'equipamento', 'habilidades'];
  jsonFields.forEach(field => {
    if (rest[field] === undefined || rest[field] === null) {
      rest[field] = null;
    } else if (typeof rest[field] === 'string') {
      try {
        rest[field] = JSON.parse(rest[field]);
      } catch {
        rest[field] = null;
      }
    } else if (Array.isArray(rest[field]) && rest[field].length === 0) {
      rest[field] = null;
    }
  });

  // Remove undefined values
  Object.keys(rest).forEach(key => {
    if (rest[key] === undefined) {
      delete rest[key];
    }
  });

  return rest;
};

// 🔥 Função para preparar dados para resposta
const prepareHistoricoResponse = (historico) => {
  if (!historico) return null;

  return {
    ...historico,
    elementos: historico.elementos || null,
    equipamento: historico.equipamento || null,
    habilidades: historico.habilidades || null,
    formas_desbloqueadas: historico.formas_desbloqueadas || [],
    inventario: historico.capitulo?.inventarios || []
  };
};

// 🔥 STORE
const store = async (req, res) => {
  try {
    const validatedData = historicoSchema.parse(req.body);
    const dataToSave = sanitizeHistoricoData(validatedData);

    const historico = await prisma.personagem_historico.create({
      data: dataToSave,
      include: {
        raca: true,
        livro: true,
        capitulo: {
          include: {
            inventarios: {
              include: {
                itens: true
              }
            }
          }
        }
      }
    });

    const response = prepareHistoricoResponse(historico);

    return res.status(201).json({
      success: true,
      data: response,
      message: 'Histórico criado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no store:', error);
    return handleErrors(res, error, "store");
  }
};

// 🔥 UPDATE
const update = async (req, res) => {
  const { id } = req.params;
  const historicoId = Number(id);

  if (isNaN(historicoId)) {
    return res.status(400).json({
      success: false,
      error: 'ID inválido',
      message: 'O ID fornecido não é um número válido'
    });
  }

  try {
    const existingHistorico = await prisma.personagem_historico.findUnique({
      where: { id: historicoId }
    });

    if (!existingHistorico) {
      return res.status(404).json({
        success: false,
        error: 'Registro não encontrado',
        message: `Histórico com ID ${historicoId} não encontrado`
      });
    }

    const validatedData = historicoSchema.parse(req.body);
    const dataToSave = sanitizeHistoricoData(validatedData);

    const historico = await prisma.personagem_historico.update({
      where: { id: historicoId },
      data: dataToSave,
      include: {
        raca: true,
        livro: true,
        capitulo: {
          include: {
            inventarios: {
              include: {
                itens: true
              }
            }
          }
        }
      }
    });

    const response = prepareHistoricoResponse(historico);

    return res.json({
      success: true,
      data: response,
      message: 'Histórico atualizado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no update:', error);
    return handleErrors(res, error, "update");
  }
};

// 🔥 SHOW
const show = async (req, res) => {
  const { id } = req.params;
  const historicoId = Number(id);

  if (isNaN(historicoId)) {
    return res.status(400).json({
      success: false,
      error: 'ID inválido',
      message: 'O ID fornecido não é um número válido'
    });
  }

  try {
    const historico = await prisma.personagem_historico.findUnique({
      where: { id: historicoId },
      include: {
        raca: true,
        livro: true,
        capitulo: {
          include: {
            inventarios: {
              include: {
                itens: true
              }
            }
          }
        }
      }
    });

    if (!historico) {
      return res.status(404).json({
        success: false,
        error: 'Registro não encontrado',
        message: `Histórico com ID ${historicoId} não encontrado`
      });
    }

    const response = prepareHistoricoResponse(historico);

    return res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('❌ Erro no show:', error);
    return handleErrors(res, error, "show");
  }
};

// 🔥 TIMELINE - CORRIGIDO
const timeline = async (req, res) => {
  // Aceita ambos os nomes de parâmetro para compatibilidade
  const { personagemId, personajeId } = req.params;
  const idParam = personagemId || personajeId;
  const personagemIdNum = Number(idParam);

  if (isNaN(personagemIdNum)) {
    return res.status(400).json({
      success: false,
      error: 'ID inválido',
      message: 'O ID do personagem fornecido não é um número válido'
    });
  }

  try {
    const personagem = await prisma.personagem.findUnique({
      where: { id: personagemIdNum },
      select: { id: true, nome: true }
    });

    if (!personagem) {
      return res.status(404).json({
        success: false,
        error: 'Personagem não encontrado',
        message: `Personagem com ID ${personagemIdNum} não encontrado`
      });
    }

    const historicos = await prisma.personagem_historico.findMany({
      where: { personagem_id: personagemIdNum },
      include: {
        raca: true,
        livro: {
          select: {
            id: true,
            titulo: true
          }
        },
        capitulo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            inventarios: {
              include: {
                itens: {
                  select: {
                    id: true,
                    nome: true,
                    descricao: true,
                    tipo: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { criado_em: 'desc' }
    });

    const response = historicos.map(historico => ({
      ...prepareHistoricoResponse(historico),
      personagem: {
        id: personagem.id,
        nome: personagem.nome
      }
    }));

    return res.json({
      success: true,
      data: response,
      count: response.length,
      message: response.length > 0 ? 'Históricos encontrados' : 'Nenhum histórico encontrado para este personagem'
    });
  } catch (error) {
    console.error('❌ Erro no timeline:', error);
    return handleErrors(res, error, "timeline");
  }
};

// 🔥 DESTROY
const destroy = async (req, res) => {
  const { id } = req.params;
  const historicoId = Number(id);

  if (isNaN(historicoId)) {
    return res.status(400).json({
      success: false,
      error: 'ID inválido',
      message: 'O ID fornecido não é um número válido'
    });
  }

  try {
    const existingHistorico = await prisma.personagem_historico.findUnique({
      where: { id: historicoId }
    });

    if (!existingHistorico) {
      return res.status(404).json({
        success: false,
        error: 'Registro não encontrado',
        message: `Histórico com ID ${historicoId} não encontrado`
      });
    }

    await prisma.personagem_historico.delete({
      where: { id: historicoId }
    });

    return res.status(204).send();
  } catch (error) {
    console.error('❌ Erro no destroy:', error);
    return handleErrors(res, error, "destroy");
  }
};

// 🔥 FUNÇÃO handleErrors
function handleErrors(res, error, context) {
  // 1. Verifica se é erro do Zod
  if (error instanceof ZodError) {
    const errors = error.issues || error.errors || [];

    console.error('❌ Erro de validação Zod:', JSON.stringify(errors, null, 2));

    return res.status(400).json({
      success: false,
      error: "Erro de validação",
      detalhes: errors.map(e => ({
        campo: e.path?.join('.') || 'campo desconhecido',
        mensagem: e.message,
        codigo: e.code,
        recebido: e.received,
        esperado: e.expected,
        ...(e.minimum !== undefined && { minimo: e.minimum }),
        ...(e.maximum !== undefined && { maximo: e.maximum })
      }))
    });
  }

  // 2. Verifica se é erro do Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    console.error(`❌ PRISMA ERROR (${context}):`, {
      code: error.code,
      message: error.message,
      meta: error.meta
    });

    switch (error.code) {
      case 'P2025':
        return res.status(404).json({
          success: false,
          error: 'Registro não encontrado',
          message: 'O registro que você está tentando modificar não existe.'
        });

      case 'P2002':
        return res.status(409).json({
          success: false,
          error: 'Conflito de dados',
          message: `Já existe um registro com este valor para o campo "${error.meta?.target || 'desconhecido'}"`,
          detalhe: error.meta?.target
        });

      case 'P2003':
        return res.status(400).json({
          success: false,
          error: 'Erro de integridade referencial',
          message: 'O valor de referência não existe no banco de dados.',
          detalhe: error.meta?.field_name || 'Campo desconhecido'
        });

      case 'P2011':
        return res.status(400).json({
          success: false,
          error: 'Campo obrigatório',
          message: error.meta?.message || 'Um campo obrigatório está faltando.'
        });

      case 'P2012':
        return res.status(400).json({
          success: false,
          error: 'Valor inválido',
          message: `Valor inválido para o campo "${error.meta?.path || 'desconhecido'}"`
        });

      case 'P2006':
        return res.status(400).json({
          success: false,
          error: 'Tipo de dado inválido',
          message: `O valor fornecido para o campo "${error.meta?.target || 'desconhecido'}" é de um tipo inválido.`,
          detalhe: error.meta
        });

      default:
        return res.status(500).json({
          success: false,
          error: 'Erro no banco de dados',
          message: error.message || 'Erro ao processar a operação no banco de dados',
          code: error.code,
          detalhe: error.meta || undefined
        });
    }
  }

  // 3. Erros genéricos
  console.error(`❌ Erro interno (${context}):`, error);

  const mensagem = error?.message || 'Erro interno do servidor';
  const stack = process.env.NODE_ENV === 'development' ? error?.stack : undefined;

  return res.status(500).json({
    success: false,
    error: `Erro interno no servidor`,
    message: mensagem,
    context: context,
    ...(stack && { stack })
  });
}

// 🔥 EXPORTAÇÃO
export default {
  store,
  update,
  show,
  destroy,
  timeline,
  sanitizeHistoricoData,
  prepareHistoricoResponse,
  handleErrors
};