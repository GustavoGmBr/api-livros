import prisma from '../lib/prisma.js';
import { historicoSchema } from '../validator/historico.validator.js';
import { ZodError } from 'zod';

// 🔥 Função para sanitizar dados antes de salvar
const sanitizeHistoricoData = (data) => {
  const { inventario, ...rest } = data;
  
  // Sanitiza formas_desbloqueadas
  if (rest.formas_desbloqueadas && Array.isArray(rest.formas_desbloqueadas)) {
    rest.formas_desbloqueadas = rest.formas_desbloqueadas
      .filter(forma => forma.forma_id) // Remove entradas inválidas
      .map((forma) => ({
        forma_id: Number(forma.forma_id),
        subnivel: Math.min(Math.max(Number(forma.subnivel) || 1, 1), 5), // Garante entre 1-5
        pcForma: Number(forma.pcForma) || 0,
        bonusPC: Number(forma.bonusPC) || 0,
        bonusAetheris: Number(forma.bonusAetheris) || 0
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
    if (rest[field] === undefined) {
      delete rest[field];
    } else if (typeof rest[field] === 'string') {
      try {
        rest[field] = JSON.parse(rest[field]);
      } catch {
        rest[field] = null;
      }
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
    // Garante que campos JSON sejam parseados corretamente
    elementos: historico.elementos || null,
    equipamento: historico.equipamento || null,
    habilidades: historico.habilidades || null,
    formas_desbloqueadas: historico.formas_desbloqueadas || [],
    inventario: historico.capitulo?.inventarios || []
  };
};

// 🔥 Função para extrair dados válidos do body
const extractValidData = (body) => {
  // Garante que campos de select HTML sejam tratados corretamente
  const processedData = { ...body };
  
  // Campos que podem vir como string vazia e devem ser null
  const nullableFields = ['livro_id', 'capitulo_id', 'idade', 'titulo', 
                         'ranque', 'classificacao', 'classes', 'estilo_luta', 
                         'maestria'];
  
  nullableFields.forEach(field => {
    if (processedData[field] === '') {
      processedData[field] = null;
    }
  });

  // Garante que arrays sejam tratados corretamente
  if (processedData.formas_desbloqueadas === '') {
    processedData.formas_desbloqueadas = null;
  }

  return processedData;
};

const store = async (req, res) => {
  try {
    // 1. Extrai e processa dados do body
    const processedData = extractValidData(req.body);

    // 2. Validação dos dados com Zod
    const validatedData = historicoSchema.parse(processedData);

    // 3. Sanitização dos dados
    const dataToSave = sanitizeHistoricoData(validatedData);

    // 4. Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 Dados a serem salvos (store):', JSON.stringify({
        ...dataToSave,
        formas_desbloqueadas: dataToSave.formas_desbloqueadas?.length || 0
      }, null, 2));
    }

    // 5. Criação no banco
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

    // 6. Formata resposta
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

const update = async (req, res) => {
  const { id } = req.params;
  const historicoId = Number(id);

  // Valida ID
  if (isNaN(historicoId)) {
    return res.status(400).json({
      success: false,
      error: 'ID inválido',
      message: 'O ID fornecido não é um número válido'
    });
  }

  try {
    // 1. Verifica se o registro existe
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

    // 2. Extrai e processa dados do body
    const processedData = extractValidData(req.body);

    // 3. Validação dos dados com Zod
    const validatedData = historicoSchema.parse(processedData);

    // 4. Sanitização dos dados
    const dataToSave = sanitizeHistoricoData(validatedData);

    // 5. Log para debug (apenas em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('📦 Dados a serem salvos (update):', JSON.stringify({
        ...dataToSave,
        formas_desbloqueadas: dataToSave.formas_desbloqueadas?.length || 0
      }, null, 2));
    }

    // 6. Atualização no banco
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

    // 7. Formata resposta
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

const show = async (req, res) => {
  const { id } = req.params;
  const historicoId = Number(id);

  // Valida ID
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

    // Formata resposta
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

const timeline = async (req, res) => {
  const { personajeId } = req.params;
  const personagemId = Number(personajeId);

  // Valida ID
  if (isNaN(personagemId)) {
    return res.status(400).json({
      success: false,
      error: 'ID inválido',
      message: 'O ID do personagem fornecido não é um número válido'
    });
  }

  try {
    // Verifica se o personagem existe
    const personagem = await prisma.personagem.findUnique({
      where: { id: personagemId },
      select: { id: true, nome: true }
    });

    if (!personagem) {
      return res.status(404).json({
        success: false,
        error: 'Personagem não encontrado',
        message: `Personagem com ID ${personagemId} não encontrado`
      });
    }

    const historicos = await prisma.personagem_historico.findMany({
      where: { personagem_id: personagemId },
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

    // Formata resposta
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

const destroy = async (req, res) => {
  const { id } = req.params;
  const historicoId = Number(id);

  // Valida ID
  if (isNaN(historicoId)) {
    return res.status(400).json({
      success: false,
      error: 'ID inválido',
      message: 'O ID fornecido não é um número válido'
    });
  }

  try {
    // Verifica se o registro existe antes de deletar
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

// 🔥 FUNÇÃO handleErrors MELHORADA
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

      default:
        return res.status(500).json({
          success: false,
          error: 'Erro no banco de dados',
          message: error.message || 'Erro ao processar a operação no banco de dados',
          code: error.code
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

// 🔥 Exportação dos middlewares e funções auxiliares
export default { 
  store, 
  update, 
  show, 
  destroy, 
  timeline,
  sanitizeHistoricoData,
  prepareHistoricoResponse,
  handleErrors,
  extractValidData
};