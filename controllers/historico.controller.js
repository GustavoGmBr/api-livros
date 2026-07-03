import prisma from '../lib/prisma.js';
import { historicoSchema } from '../validator/historico.validator.js';
import { ZodError } from 'zod';

const store = async (req, res) => {
  try {
    // Parse e validação dos dados
    const validatedData = historicoSchema.parse(req.body);
    
    // 🔥 EXTRAIR campos que não devem ir para o banco diretamente
    const { inventario, ...rest } = validatedData;

    // 🔥 LOG para debug
    console.log('📦 Dados validados (store):', JSON.stringify({
      ...rest,
      formas_desbloqueadas: rest.formas_desbloqueadas?.length || 0
    }, null, 2));

    const historico = await prisma.personagem_historico.create({
      data: rest,
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
    
    // 🔥 EXTRAIR campos que não devem ir para o banco diretamente
    const { inventario, ...rest } = validatedData;

    // 🔥 LOG para debug
    console.log('📦 Dados validados (update):', JSON.stringify({
      ...rest,
      formas_desbloqueadas: rest.formas_desbloqueadas?.length || 0
    }, null, 2));

    const historico = await prisma.personagem_historico.update({
      where: { id: historicoId },
      data: rest,
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
        recebido: e.received
      }))
    });
  }
  
  // 🔥 Verifica se é erro do Prisma
  if (error.code) {
    // Erro de registro não encontrado
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Registro não encontrado' });
    }
    
    // Erro de chave duplicada
    if (error.code === 'P2002') {
      const target = error.meta?.target || 'campo desconhecido';
      return res.status(409).json({ 
        error: `Conflito: O valor para "${target}" já existe` 
      });
    }
    
    // Erro de foreign key
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Erro de integridade: Referência inválida',
        detalhe: error.meta?.field_name || 'Campo desconhecido'
      });
    }
  }
  
  // 🔥 Erros genéricos
  console.error(`❌ Erro interno (${context}):`, error);
  
  // 🔥 Verifica se error tem mensagem
  const mensagem = error?.message || 'Erro interno do servidor';
  
  return res.status(500).json({ 
    error: `Erro interno no servidor (${context})`,
    message: mensagem
  });
}

export default { store, update, show, destroy, timeline };