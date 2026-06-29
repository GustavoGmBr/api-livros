// server/controllers/inventario.controller.js
import { PrismaClient } from '@prisma/client';
import { ZodError } from 'zod';
import { inventarioSchema, moedaPadraoSchema } from '../validator/inventario.validator.js';

const prisma = new PrismaClient();

const inventarioController = {
  // 📋 Listar inventários por capítulo
  async index(req, res) {
    try {
      const { capituloId } = req.query; // 🔥 Mudança: historicoId -> capituloId

      // Se não tiver capituloId, retorna todos os itens
      if (!capituloId) {
        const items = await prisma.inventarios.findMany({
          orderBy: { nome: 'asc' },
          include: {
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
        return res.json(items);
      }

      const cId = Number(capituloId);
      
      // Busca itens do capítulo específico
      const items = await prisma.inventarios.findMany({
        where: { capitulo_id: cId },
        orderBy: { nome: 'asc' },
        include: {
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

      res.json(items);
    } catch (error) {
      handleErrors(res, error, "index");
    }
  },

  // 🔥 Criar moeda padrão para um capítulo
  async criarMoedaPadrao(req, res) {
    try {
      const { capitulo_id } = req.body;
      
      // Validar
      const data = moedaPadraoSchema.parse({ capitulo_id });

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
          nome: data.nome,
          tipo: data.tipo,
          quantidade: data.quantidade,
          subtipo: data.subtipo,
          descricao: data.descricao
        }
      });

      res.status(201).json(novaMoeda);
    } catch (error) {
      handleErrors(res, error, "criarMoedaPadrao");
    }
  },

  // ➕ Criar novo item
  async store(req, res) {
    try {
      const data = inventarioSchema.parse(req.body);

      // Verificar se o capítulo existe
      const capitulo = await prisma.capitulos.findUnique({
        where: { id: data.capitulo_id }
      });

      if (!capitulo) {
        return res.status(404).json({ error: 'Capítulo não encontrado' });
      }

      // Verifica se já existe um item com mesmo nome, tipo e subtipo no mesmo capítulo
      const itemExistente = await prisma.inventarios.findFirst({
        where: {
          capitulo_id: data.capitulo_id,
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
          capitulo_id: data.capitulo_id,
          nome: data.nome,
          tipo: data.tipo || '',
          quantidade: Number(data.quantidade) || 0,
          subtipo: data.subtipo || '',
          descricao: data.descricao || ''
        }
      });

      res.status(201).json(novoItem);
    } catch (error) {
      handleErrors(res, error, "store");
    }
  },

  // 🔍 Buscar item específico
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

  // ✏️ Atualizar item
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
          capitulo_id: data.capitulo_id,
          nome: data.nome,
          tipo: data.tipo || '',
          quantidade: Number(data.quantidade) || 0,
          subtipo: data.subtipo || '',
          descricao: data.descricao || ''
        }
      });

      res.json(itemAtualizado);
    } catch (error) {
      handleErrors(res, error, "update");
    }
  },

  // 💰 Atualizar dinheiro
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

  // 🗑️ Deletar item
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

  // 📊 Estatísticas do inventário por capítulo
  async stats(req, res) {
    try {
      const { capituloId } = req.query;

      if (!capituloId) {
        return res.status(400).json({ error: 'capituloId é obrigatório' });
      }

      const cId = Number(capituloId);
      
      const items = await prisma.inventarios.findMany({
        where: { capitulo_id: cId }
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
  },

  // 🔥 Verificar se capítulo tem inventário
  async checkExists(req, res) {
    try {
      const { capituloId } = req.params;

      if (!capituloId) {
        return res.status(400).json({ error: 'capituloId é obrigatório' });
      }

      const cId = Number(capituloId);
      
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
      message: 'O capítulo informado não existe'
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