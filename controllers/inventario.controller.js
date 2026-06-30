// server/controllers/inventario.controller.js
import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import { inventarioSchema, moedaPadraoSchema } from '../validator/inventario.validator.js';

const prisma = new PrismaClient();

const inventarioController = {
  // 📋 Listar inventários por capítulo
  async index(req, res) {
    try {
      const { capituloId } = req.query;

      // Objeto padrão de inclusão para evitar repetição de código
      const defaultInclude = {
        itens: true, // 📦 Traz as informações do item associado (id_item, nome original, etc.)
        capitulo: {
          select: {
            id: true,
            numero: true,
            titulo: true,
            livro: {
              select: {
                id: true,
                titulo: true,
                saga: {
                  select: {
                    id: true,
                    nome: true
                  }
                }
              }
            }
          }
        }
      };

      // Se não tiver capituloId, retorna todos os itens do sistema
      if (!capituloId) {
        const items = await prisma.inventarios.findMany({
          orderBy: { nome: 'asc' },
          include: defaultInclude
        });
        return res.json(items);
      }

      const cId = Number(capituloId);
      if (isNaN(cId)) {
        return res.status(400).json({ error: "capituloId inválido" });
      }
      
      // Busca itens do capítulo específico
      const items = await prisma.inventarios.findMany({
        where: { capitulo_id: cId },
        orderBy: { nome: 'asc' },
        include: defaultInclude
      });

      res.json(items);
    } catch (error) {
      handleErrors(res, error, "index");
    }
  },

  // 🔥 Criar moeda padrão para um capítulo
  async criarMoedaPadrao(req, res) {
    try {
      const { capitulo_id } = req.body;
      
      // Validar via Zod
      const data = moedaPadraoSchema.parse({ capitulo_id: Number(capitulo_id) });

      // Verificar se o capítulo existe
      const capitulo = await prisma.capitulos.findUnique({
        where: { id: data.capitulo_id }
      });

      if (!capitulo) {
        return res.status(404).json({ error: 'Capítulo não encontrado' });
      }

      // Verificar se já existe uma moeda para este capítulo
      const moedaExistente = await prisma.inventarios.findFirst({
        where: {
          capitulo_id: data.capitulo_id,
          tipo: 'Moeda'
        }
      });

      if (moedaExistente) {
        return res.status(409).json({ 
          error: 'Este capítulo já possui uma moeda padrão',
          moeda: moedaExistente
        });
      }

      // Criar a moeda padrão
      const novaMoeda = await prisma.inventarios.create({
        data: {
          capitulo_id: data.capitulo_id,
          nome: data.nome || 'Moedas de Ouro',
          tipo: 'Moeda',
          quantidade: data.quantidade || 0,
          subtipo: data.subtipo || 'Padrão',
          descricao: data.descricao || 'Moeda corrente utilizada neste capítulo.'
        }
      });

      res.status(201).json(novaMoeda);
    } catch (error) {
      handleErrors(res, error, "criarMoedaPadrao");
    }
  },

  // ➕ Criar novo item ou somar quantidade se já existir
  async store(req, res) {
    try {
      const data = inventarioSchema.parse(req.body);
      const cId = Number(data.capitulo_id);

      // Verificar se o capítulo existe
      const capitulo = await prisma.capitulos.findUnique({
        where: { id: cId }
      });

      if (!capitulo) {
        return res.status(404).json({ error: 'Capítulo não encontrado' });
      }

      // Verifica se já existe um item com mesmo nome, tipo e subtipo no mesmo capítulo
      const itemExistente = await prisma.inventarios.findFirst({
        where: {
          capitulo_id: cId,
          nome: data.nome,
          tipo: data.tipo,
          subtipo: data.subtipo
        }
      });

      // Se existir, soma a quantidade
      if (itemExistente) {
        const novaQuantidade = Number(itemExistente.quantidade) + (Number(data.quantidade) || 0);
        const atualizado = await prisma.inventarios.update({
          where: { id: itemExistente.id },
          data: {
            quantidade: novaQuantidade,
            descricao: data.descricao || itemExistente.descricao
          }
        });
        return res.json(atualizado);
      }

      // Cria novo item do inventário vinculado ao capítulo
      const novoItem = await prisma.inventarios.create({
        data: {
          capitulo_id: cId,
          nome: data.nome,
          tipo: data.tipo || '',
          quantidade: Number(data.quantidade) || 0,
          subtipo: data.subtipo || '',
          descricao: data.descricao || '',
          itensId_item: data.itensId_item ? Number(data.itensId_item) : null
        }
      });

      res.status(201).json(novoItem);
    } catch (error) {
      handleErrors(res, error, "store");
    }
  },

  // 🔍 Buscar registro de inventário específico por ID
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
          itens: true, // 📦 Inclui dados do item global
          capitulo: {
            select: {
              id: true,
              numero: true,
              titulo: true,
              livro: {
                select: {
                  id: true,
                  titulo: true,
                  saga: {
                    select: {
                      id: true,
                      nome: true
                    }
                  }
                }
              }
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

  // ✏️ Atualizar item completo
  async update(req, res) {
    try {
      const { id } = req.params;
      const itemId = Number(id);
      const data = inventarioSchema.parse(req.body);

      if (isNaN(itemId)) {
        return res.status(400).json({ error: "ID do inventário inválido" });
      }

      // Verifica se o item existe
      const itemExistente = await prisma.inventarios.findUnique({
        where: { id: itemId }
      });

      if (!itemExistente) {
        return res.status(404).json({ error: 'Item não encontrado no inventário' });
      }

      const itemAtualizado = await prisma.inventarios.update({
        where: { id: itemId },
        data: {
          capitulo_id: Number(data.capitulo_id),
          nome: data.nome,
          tipo: data.tipo || '',
          quantidade: Number(data.quantidade) || 0,
          subtipo: data.subtipo || '',
          descricao: data.descricao || '',
          itensId_item: data.itensId_item ? Number(data.itensId_item) : null
        }
      });

      res.json(itemAtualizado);
    } catch (error) {
      handleErrors(res, error, "update");
    }
  },

  // 💰 Atualizar dinheiro (somar, subtrair ou definir valor fixo)
  async updateDinheiro(req, res) {
    try {
      const { id } = req.params;
      const itemId = Number(id);
      const { operacao, valor } = req.body;

      if (isNaN(itemId)) {
        return res.status(400).json({ error: 'ID inválido' });
      }

      if (!operacao || valor === undefined || valor === null) {
        return res.status(400).json({ error: 'Operação e valor são obrigatórios' });
      }

      const itemExistente = await prisma.inventarios.findUnique({
        where: { id: itemId }
      });

      if (!itemExistente) {
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      if (itemExistente.tipo !== 'Moeda') {
        return res.status(400).json({ error: 'Este item não é uma moeda' });
      }

      let novaQuantidade = Number(itemExistente.quantidade);
      const valorAlteracao = Number(valor);

      switch (operacao) {
        case 'adicionar':
        case 'somar':
          novaQuantidade += valorAlteracao;
          break;
        case 'remover':
        case 'subtrair':
          if (novaQuantidade < valorAlteracao) {
            return res.status(400).json({ error: 'Saldo insuficiente para esta operação' });
          }
          novaQuantidade -= valorAlteracao;
          break;
        case 'fixo':
          if (valorAlteracao < 0) {
            return res.status(400).json({ error: 'Valor não pode ser negativo' });
          }
          novaQuantidade = valorAlteracao;
          break;
        default:
          return res.status(400).json({ 
            error: 'Operação inválida. Use: adicionar, remover ou fixo' 
          });
      }

      const atualizado = await prisma.inventarios.update({
        where: { id: itemId },
        data: { quantidade: novaQuantidade }
      });

      res.json(atualizado);
    } catch (error) {
      handleErrors(res, error, "updateDinheiro");
    }
  },

  // 🗑️ Deletar item do inventário
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const itemId = Number(id);

      if (isNaN(itemId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

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

  // 📊 Estatísticas do inventário por capítulo
  async stats(req, res) {
    try {
      const { capituloId } = req.query;

      if (!capituloId) {
        return res.status(400).json({ error: 'capituloId é obrigatório nos query params' });
      }

      const cId = Number(capituloId);
      if (isNaN(cId)) {
        return res.status(400).json({ error: 'capituloId inválido' });
      }
      
      const items = await prisma.inventarios.findMany({
        where: { capitulo_id: cId }
      });

      const totalItems = items.length;
      const totalMoedas = items
        .filter(item => item.tipo === 'Moeda')
        .reduce((acc, curr) => acc + Number(curr.quantidade), 0);
      
      const tipos = items.reduce((acc, item) => {
        const tipoKey = item.tipo || 'Sem Tipo';
        acc[tipoKey] = (acc[tipoKey] || 0) + 1;
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
  },

  // 🔥 Verificar se capítulo tem itens registrados no inventário
  async checkExists(req, res) {
    try {
      // Aceita tanto :capituloId quanto :id baseado na definição da sua rota express
      const capituloId = req.params.capituloId || req.params.id;

      if (!capituloId) {
        return res.status(400).json({ error: 'ID do capítulo é obrigatório nos parâmetros da rota' });
      }

      const cId = Number(capituloId);
      if (isNaN(cId)) {
        return res.status(400).json({ error: 'ID do capítulo inválido' });
      }
      
      const items = await prisma.inventarios.findMany({
        where: { capitulo_id: cId },
        take: 1
      });

      res.json({
        exists: items.length > 0,
        capitulo_id: cId
      });
    } catch (error) {
      handleErrors(res, error, "checkExists");
    }
  }
};

// 🛠️ Função unificada para tratamento de erros
function handleErrors(res, error, context) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      error: "Dados inválidos",
      detalhes: error.errors.map(e => ({
        campo: e.path.join('.'),
        mensagem: e.message
      }))
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({ error: 'Registro não encontrado no banco de dados' });
  }

  if (error.code === 'P2003') {
    return res.status(400).json({
      error: 'Violação de chave estrangeira',
      message: 'O id do capítulo ou id do item informado não existe no sistema.'
    });
  }

  if (error.code === 'P2000') {
    return res.status(400).json({
      error: 'Dado muito longo',
      message: 'Um dos campos excede o tamanho máximo configurado no banco MySQL.'
    });
  }

  console.error(`❌ Erro no Inventário (${context}):`, error);
  
  return res.status(500).json({
    error: 'Erro interno no servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Ocorreu um erro inesperado no inventário'
  });
}

export default inventarioController;