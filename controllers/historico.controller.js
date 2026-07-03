import prisma from '../lib/prisma.js';
import { historicoSchema } from '../validator/historico.validator.js';
import { ZodError } from 'zod';

// 🔥 Função para sanitizar os dados - remove o relacionamento direto e previne quebras
const sanitizeHistoricoData = (data) => {
  const { inventario, ...rest } = data;
  
  // O Zod já valida e coage a estrutura de formas_desbloqueadas corretamente,
  // mas garantimos que se for nulo/indefinido ele passe de forma limpa para o Prisma.
  if (rest.formas_desbloqueadas === undefined) {
    rest.formas_desbloqueadas = null;
  }
  
  return rest;
};

const store = async (req, res) => {
  try {
    // Parse e validação dos dados (Zod já valida e converte a nova estrutura de formas_desbloqueadas)
    const validatedData = historicoSchema.parse(req.body);
    
    // 🔥 SANITIZAR: Remover o campo inventario (tabela relacionada) antes de salvar no Prisma
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
    
    // 🔥 SANITIZAR: Remover o campo inventario antes de atualizar no Prisma
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

// 🔥 FUNÇÃO handleErrors
function handleErrors(res, error, context) {
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
  
  if (error && typeof error === 'object' && 'code' in error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Registro não encontrado',
        message: 'O registro que você está tentando modificar não existe.'
      });
    }
    
    if (error.code === 'P2002') {
      const target = error.meta?.target || 'campo desconhecido';
      return res.status(409).json({ 
        error: `Conflito: O valor para "${target}" já existe`,
        message: 'Já existe um registro com este valor.'
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Erro de integridade: Referência inválida',
        message: 'O valor de referência não existe no banco de dados.',
        detalhe: error.meta?.field_name || 'Campo desconhecido'
      });
    }

    if (error.code === 'P2011') {
      return res.status(400).json({ 
        error: 'Campo obrigatório não preenchido',
        message: error.meta?.message || 'Um campo obrigatório está faltando.'
      });
    }
  }
  
  console.error(`❌ Erro interno (${context}):`, error);
  
  const mensagem = error?.message || 'Erro interno do servidor';
  const stack = process.env.NODE_ENV === 'development' ? error?.stack : undefined;
  
  return res.status(500).json({ 
    error: `Erro interno no servidor (${context})`,
    message: mensagem,
    ...(stack && { stack })
  });
}

export default { store, update, show, destroy, timeline };