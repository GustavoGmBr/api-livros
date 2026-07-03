import prisma from '../lib/prisma.js';
import { historicoSchema } from '../validator/historico.validator.js';
import { ZodError } from 'zod';

// 🔥 Função para sanitizar os dados - remove campos extras e garante formato correto
const sanitizeHistoricoData = (data) => {
  const { inventario, ...rest } = data;
  
  // 🔥 Garantir que formas_desbloqueadas só tenha os campos permitidos
  if (rest.formas_desbloqueadas && Array.isArray(rest.formas_desbloqueadas)) {
    rest.formas_desbloqueadas = rest.formas_desbloqueadas.map((forma) => ({
      forma_id: Number(forma.forma_id),
      pcForma: Number(forma.pcForma) || 0,
      ranque: forma.ranque || '',
      bonusAetheris: Number(forma.bonusAetheris) || 0
    }));
  }
  
  return rest;
};

const store = async (req, res) => {
  try {
    // Parse e validação dos dados
    const validatedData = historicoSchema.parse(req.body);
    
    // 🔥 SANITIZAR: Remover campos extras e garantir formato correto
    const dataToSave = sanitizeHistoricoData(validatedData);

    // 🔥 LOG para debug
    console.log('📦 Dados a serem salvos (store):', JSON.stringify({
      ...dataToSave,
      formas_desbloqueadas: dataToSave.formas_desbloqueadas?.length || 0
    }, null, 2));

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
    
    // 🔥 SANITIZAR: Remover campos extras e garantir formato correto
    const dataToSave = sanitizeHistoricoData(validatedData);

    // 🔥 LOG para debug
    console.log('📦 Dados a serem salvos (update):', JSON.stringify({
      ...dataToSave,
      formas_desbloqueadas: dataToSave.formas_desbloqueadas?.length || 0
    }, null, 2));

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
    
    if (!historico) {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    return res.json(historico);
  } catch (error) {
    console.error('❌ Erro no show:', error);
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
    console.error('❌ Erro no timeline:', error);
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
    console.error('❌ Erro no destroy:', error);
    handleErrors(res, error, "destroy");
  }
};

// 🔥 FUNÇÃO handleErrors CORRIGIDA
function handleErrors(res, error, context) {
  // 🔥 Verifica se é erro do Zod
  if (error instanceof ZodError) {
    console.error('❌ Erro de validação Zod:', JSON.stringify(error.errors, null, 2));
    return res.status(400).json({ 
      error: "Erro de validação", 
      detalhes: error.errors.map(e => ({
        campo: e.path.join('.'),
        mensagem: e.message,
        codigo: e.code,
        recebido: e.received
      }))
    });
  }
  
  // 🔥 Verifica se é erro do Prisma
  if (error && typeof error === 'object' && 'code' in error) {
    // Erro de registro não encontrado
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Registro não encontrado',
        message: 'O registro que você está tentando modificar não existe.'
      });
    }
    
    // Erro de chave duplicada
    if (error.code === 'P2002') {
      const target = error.meta?.target || 'campo desconhecido';
      return res.status(409).json({ 
        error: `Conflito: O valor para "${target}" já existe`,
        message: 'Já existe um registro com este valor.'
      });
    }
    
    // Erro de foreign key
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Erro de integridade: Referência inválida',
        message: 'O valor de referência não existe no banco de dados.',
        detalhe: error.meta?.field_name || 'Campo desconhecido'
      });
    }

    // Erro de campo obrigatório
    if (error.code === 'P2011') {
      return res.status(400).json({ 
        error: 'Campo obrigatório não preenchido',
        message: error.meta?.message || 'Um campo obrigatório está faltando.'
      });
    }
  }
  
  // 🔥 Erros genéricos - log do erro completo
  console.error(`❌ Erro interno (${context}):`, error);
  
  // 🔥 Verifica se error tem mensagem
  const mensagem = error?.message || 'Erro interno do servidor';
  const stack = process.env.NODE_ENV === 'development' ? error?.stack : undefined;
  
  return res.status(500).json({ 
    error: `Erro interno no servidor (${context})`,
    message: mensagem,
    ...(stack && { stack })
  });
}

export default { store, update, show, destroy, timeline };