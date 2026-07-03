// controllers/historico.controller.js - ATUALIZADO COM MAIS LOGS
import prisma from '../lib/prisma.js';
import { historicoSchema } from '../validator/historico.validator.js';
import { ZodError } from 'zod';

// 🔥 Função para sanitizar dados antes de salvar
const sanitizeHistoricoData = (data) => {
  console.log('🔧 SANITIZE - Dados recebidos:', JSON.stringify(data, null, 2));
  
  const { inventario, ...rest } = data;
  
  // Sanitiza formas_desbloqueadas
  if (rest.formas_desbloqueadas && Array.isArray(rest.formas_desbloqueadas)) {
    rest.formas_desbloqueadas = rest.formas_desbloqueadas
      .filter(forma => forma.forma_id) // Remove entradas inválidas
      .map((forma) => ({
        forma_id: Number(forma.forma_id),
        subnivel: Math.min(Math.max(Number(forma.subnivel) || 1, 1), 5),
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

  // Trata campos JSON - IMPORTANTE: Prisma espera JSON ou null
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
      // Arrays vazios podem ser null para evitar erro no Prisma
      rest[field] = null;
    }
  });

  // Remove undefined values
  Object.keys(rest).forEach(key => {
    if (rest[key] === undefined) {
      delete rest[key];
    }
  });

  console.log('🔧 SANITIZE - Dados após sanitização:', JSON.stringify(rest, null, 2));
  
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

const store = async (req, res) => {
  try {
    console.log('📥 STORE - Body recebido:', JSON.stringify(req.body, null, 2));

    // 1. Validação dos dados com Zod
    const validatedData = historicoSchema.parse(req.body);
    console.log('✅ STORE - Dados validados:', JSON.stringify(validatedData, null, 2));

    // 2. Sanitização dos dados
    const dataToSave = sanitizeHistoricoData(validatedData);
    console.log('✅ STORE - Dados prontos para salvar:', JSON.stringify(dataToSave, null, 2));

    // 3. Criação no banco
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

    // 4. Formata resposta
    const response = prepareHistoricoResponse(historico);

    return res.status(201).json({
      success: true,
      data: response,
      message: 'Histórico criado com sucesso'
    });
  } catch (error) {
    console.error('❌ STORE - Erro detalhado:', error);
    console.error('❌ STORE - Stack:', error.stack);
    
    // Log específico para erros do Prisma
    if (error.code) {
      console.error('❌ STORE - Prisma error code:', error.code);
      console.error('❌ STORE - Prisma error meta:', error.meta);
    }
    
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
    console.log(`📥 UPDATE ${historicoId} - Body recebido:`, JSON.stringify(req.body, null, 2));

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

    // 2. Validação dos dados com Zod
    const validatedData = historicoSchema.parse(req.body);
    console.log(`✅ UPDATE ${historicoId} - Dados validados:`, JSON.stringify(validatedData, null, 2));

    // 3. Sanitização dos dados
    const dataToSave = sanitizeHistoricoData(validatedData);
    console.log(`✅ UPDATE ${historicoId} - Dados prontos para salvar:`, JSON.stringify(dataToSave, null, 2));

    // 4. Atualização no banco
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

    // 5. Formata resposta
    const response = prepareHistoricoResponse(historico);

    return res.json({
      success: true,
      data: response,
      message: 'Histórico atualizado com sucesso'
    });
  } catch (error) {
    console.error(`❌ UPDATE ${historicoId} - Erro detalhado:`, error);
    console.error(`❌ UPDATE ${historicoId} - Stack:`, error.stack);
    
    if (error.code) {
      console.error(`❌ UPDATE ${historicoId} - Prisma error code:`, error.code);
      console.error(`❌ UPDATE ${historicoId} - Prisma error meta:`, error.meta);
    }
    
    return handleErrors(res, error, "update");
  }
};

// ... (restante do código igual, apenas com mais logs)

// 🔥 FUNÇÃO handleErrors MELHORADA
function handleErrors(res, error, context) {
  // Log completo do erro
  console.error(`❌ HANDLE ERRORS (${context}):`, error);
  
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
    // Log detalhado do erro Prisma
    console.error(`❌ PRISMA ERROR (${context}):`, {
      code: error.code,
      message: error.message,
      meta: error.meta,
      clientVersion: error.clientVersion
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

      // 🔥 ADICIONADO: Erro de tipo de campo
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