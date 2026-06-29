// server/controllers/inventario.controller.js
import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import { inventarioSchema } from '../validator/inventario.validator.js';

// Inicializa o Prisma Client diretamente no controller
const prisma = new PrismaClient();

const inventarioController = {
  // 📋 Listar inventários (público)
  async index(req, res) {
    try {
      const { historicoId } = req.query;

      // Se não tiver historicoId, retorna todos os itens
      if (!historicoId) {
        const items = await prisma.inventarios.findMany({
          orderBy: { nome: 'asc' }
        });
        return res.json(items);
      }

      const hId = Number(historicoId);
      
      // Busca itens do histórico específico
      const items = await prisma.inventarios.findMany({
        where: { historico_id: hId },
        orderBy: { nome: 'asc' }
      });

      // ❌ REMOVIDO: Criação automática da moeda padrão
      // Agora retorna apenas os itens existentes (pode ser array vazio)

      res.json(items);
    } catch (error) {
      handleErrors(res, error, "index");
    }
  },

  // ➕ Criar novo item (privado)
  async store(req, res) {
    try {
      const data = inventarioSchema.parse(req.body);

      // Verifica se já existe um item com mesmo nome, tipo e subtipo no mesmo histórico
      const itemExistente = await prisma.inventarios.findFirst({
        where: {
          historico_id: data.historico_id,
          nome: data.nome,
          tipo: data.tipo,
          subtipo: data.subtipo
        }
      });

      // Se existir, soma a quantidade
      if (itemExistente) {
        const novaQuantidade = Number(itemExistente.quantidade) + Number(data.quantidade);
        const atualizado = await prisma.inventarios.update({
          where: { id: itemExistente.id },
          data: {
            quantidade: novaQuantidade,
            descricao: data.descricao || itemExistente.descricao
          }
        });
        return res.json(atualizado);
      }

      // Cria novo item
      const novoItem = await prisma.inventarios.create({
        data: {
          nome: data.nome,
          tipo: data.tipo,
          quantidade: Number(data.quantidade) || 0,
          subtipo: data.subtipo || '',
          descricao: data.descricao || '',
          historico_id: Number(data.historico_id)
        }
      });

      res.status(201).json(novoItem);
    } catch (error) {
      handleErrors(res, error, "store");
    }
  },

  // 🔍 Buscar item específico (público)
  async show(req, res) {
    try {
      const { id } = req.params;
      const itemId = Number(id);

      if (isNaN(itemId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const item = await prisma.inventarios.findUnique({
        where: { id: itemId },
        include: {
          historico: {
            select: {
              id: true,
              titulo: true,
              personagem_id: true
            }
          }
        }
      });

      if (!item) {
        return res.status(404).json({ error: 'Registro no inventário não encontrado' });
      }

      res.json(item);
    } catch (error) {
      handleErrors(res, error, "show");
    }
  },

  // ✏️ Atualizar item (privado)
  async update(req, res) {
    try {
      const { id } = req.params;
      const data = inventarioSchema.parse(req.body);

      // Verifica se o item existe
      const itemExistente = await prisma.inventarios.findUnique({
        where: { id: Number(id) }
      });

      if (!itemExistente) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      const itemAtualizado = await prisma.inventarios.update({
        where: { id: Number(id) },
        data: {
          nome: data.nome,
          tipo: data.tipo,
          quantidade: Number(data.quantidade) || 0,
          subtipo: data.subtipo || '',
          descricao: data.descricao || '',
          historico_id: Number(data.historico_id)
        }
      });

      res.json(itemAtualizado);
    } catch (error) {
      handleErrors(res, error, "update");
    }
  },

  // 💰 Atualizar dinheiro (privado)
  async updateDinheiro(req, res) {
    try {
      const { id } = req.params;
      const { operacao, valor } = req.body;

      // Validações básicas
      if (!operacao || valor === undefined || valor === null) {
        return res.status(400).json({ 
          error: 'Operação e valor são obrigatórios' 
        });
      }

      const itemExistente = await prisma.inventarios.findUnique({
        where: { id: Number(id) }
      });

      if (!itemExistente) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      if (itemExistente.tipo !== 'Moeda') {
        return res.status(400).json({ 
          error: 'Este item não é uma moeda' 
        });
      }

      let novaQuantidade = Number(itemExistente.quantidade);
      const valorAlteracao = Number(valor);

      // Processa a operação
      switch (operacao) {
        case 'adicionar':
        case 'somar':
          novaQuantidade += valorAlteracao;
          break;
        case 'remover':
        case 'subtrair':
          if (novaQuantidade < valorAlteracao) {
            return res.status(400).json({ 
              error: 'Saldo insuficiente para esta operação' 
            });
          }
          novaQuantidade -= valorAlteracao;
          break;
        case 'fixo':
          if (valorAlteracao < 0) {
            return res.status(400).json({ 
              error: 'Valor não pode ser negativo' 
            });
          }
          novaQuantidade = valorAlteracao;
          break;
        default:
          return res.status(400).json({ 
            error: 'Operação inválida. Use: adicionar, remover ou fixo' 
          });
      }

      const atualizado = await prisma.inventarios.update({
        where: { id: Number(id) },
        data: { quantidade: novaQuantidade }
      });

      res.json(atualizado);
    } catch (error) {
      handleErrors(res, error, "updateDinheiro");
    }
  },

  // 🗑️ Deletar item (privado)
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const itemId = Number(id);

      if (isNaN(itemId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      // Verifica se o item existe
      const itemExistente = await prisma.inventarios.findUnique({
        where: { id: itemId }
      });

      if (!itemExistente) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      await prisma.inventarios.delete({
        where: { id: itemId }
      });

      res.status(204).send();
    } catch (error) {
      handleErrors(res, error, "destroy");
    }
  },

  // 📊 Estatísticas do inventário (público)
  async stats(req, res) {
    try {
      const { historicoId } = req.query;

      if (!historicoId) {
        return res.status(400).json({ error: 'historicoId é obrigatório' });
      }

      const hId = Number(historicoId);
      
      const items = await prisma.inventarios.findMany({
        where: { historico_id: hId }
      });

      const totalItems = items.length;
      const totalMoedas = items
        .filter(item => item.tipo === 'Moeda')
        .reduce((acc, curr) => acc + Number(curr.quantidade), 0);
      
      const tipos = items.reduce((acc, item) => {
        acc[item.tipo] = (acc[item.tipo] || 0) + 1;
        return acc;
      }, {});

      res.json({
        totalItems,
        totalMoedas,
        tipos,
        items
      });
    } catch (error) {
      handleErrors(res, error, "stats");
    }
  }
};

// 🛠️ Função para tratar erros
function handleErrors(res, error, context) {
  // Erro de validação do Zod
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Dados inválidos",
      detalhes: error.errors.map(e => ({
        campo: e.path.join('.'),
        mensagem: e.message
      }))
    });
  }

  // Erro do Prisma - Registro não encontrado
  if (error.code === 'P2025') {
    return res.status(404).json({
      error: 'Registro não encontrado'
    });
  }

  // Erro do Prisma - Violação de chave estrangeira
  if (error.code === 'P2003') {
    return res.status(400).json({
      error: 'Violação de chave estrangeira',
      message: 'O histórico informado não existe'
    });
  }

  // Erro do Prisma - Dado muito longo
  if (error.code === 'P2000') {
    return res.status(400).json({
      error: 'Dado muito longo',
      message: 'Um dos campos excede o tamanho máximo permitido'
    });
  }

  // Log do erro no console
  console.error(`❌ Erro no Inventário (${context}):`, error);
  
  // Resposta genérica para outros erros
  return res.status(500).json({
    error: 'Erro interno no servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Ocorreu um erro inesperado'
  });
}

export default inventarioController;