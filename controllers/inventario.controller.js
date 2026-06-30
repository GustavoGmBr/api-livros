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

      console.log('🔍 Index - capituloId:', capituloId);

      // Se não tiver capituloId, retorna todos os itens
      if (!capituloId) {
        console.log('📦 Buscando todos os inventários');
        const items = await prisma.inventarios.findMany({
          orderBy: { nome: 'asc' },
        });
        console.log(`✅ Retornando ${items.length} itens`);
        return res.json(items);
      }

      const cId = Number(capituloId);
      if (isNaN(cId)) {
        console.log('❌ capituloId inválido:', capituloId);
        return res.status(400).json({ error: "capituloId inválido" });
      }
      
      console.log(`📦 Buscando inventários para capituloId: ${cId}`);
      
      // 🔥 CORREÇÃO: Remove o include problemático
      const items = await prisma.inventarios.findMany({
        where: { capitulo_id: cId },
        orderBy: { nome: 'asc' },
        include: {
          itens: true
          // 🔥 Remove o include do capitulo
        }
      });

      console.log(`✅ Retornando ${items.length} itens para capítulo ${cId}`);
      res.json(items);
    } catch (error) {
      console.error('❌ Erro CRÍTICO no index:', error);
      handleErrors(res, error, "index");
    }
  },

  // 🔥 Criar moeda padrão para um capítulo
  async criarMoedaPadrao(req, res) {
    try {
      const { capitulo_id } = req.body;
      
      console.log('💰 Criando moeda padrão para capitulo_id:', capitulo_id);

      const data = moedaPadraoSchema.parse({ capitulo_id: Number(capitulo_id) });

      const capitulo = await prisma.capitulos.findUnique({
        where: { id: data.capitulo_id }
      });

      if (!capitulo) {
        console.log('❌ Capítulo não encontrado:', data.capitulo_id);
        return res.status(404).json({ error: 'Capítulo não encontrado' });
      }

      const moedaExistente = await prisma.inventarios.findFirst({
        where: {
          capitulo_id: data.capitulo_id,
          tipo: 'Moeda'
        }
      });

      if (moedaExistente) {
        console.log('⚠️ Moeda já existe para este capítulo');
        return res.status(409).json({ 
          error: 'Este capítulo já possui uma moeda padrão',
          moeda: moedaExistente
        });
      }

      const novaMoeda = await prisma.inventarios.create({
        data: {
          capitulo_id: data.capitulo_id,
          nome: data.nome || 'Aether',
          tipo: 'Moeda',
          quantidade: data.quantidade || 0,
          subtipo: data.subtipo || 'Dinheiro',
          descricao: data.descricao || 'Dinheiro usado na dimensão de Aetheris'
        }
      });

      console.log('✅ Moeda padrão criada:', novaMoeda.id);
      res.status(201).json(novaMoeda);
    } catch (error) {
      console.error('❌ Erro ao criar moeda padrão:', error);
      handleErrors(res, error, "criarMoedaPadrao");
    }
  },

  // ➕ Criar novo item
  async store(req, res) {
    try {
      const data = inventarioSchema.parse(req.body);
      const cId = Number(data.capitulo_id);

      console.log('📦 Criando item no inventário:', data.nome, 'capitulo:', cId);

      const capitulo = await prisma.capitulos.findUnique({
        where: { id: cId }
      });

      if (!capitulo) {
        console.log('❌ Capítulo não encontrado:', cId);
        return res.status(404).json({ error: 'Capítulo não encontrado' });
      }

      const itemExistente = await prisma.inventarios.findFirst({
        where: {
          capitulo_id: cId,
          nome: data.nome,
          tipo: data.tipo,
          subtipo: data.subtipo
        }
      });

      if (itemExistente) {
        console.log('📦 Item já existe, somando quantidade');
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

      console.log('✅ Novo item criado:', novoItem.id);
      res.status(201).json(novoItem);
    } catch (error) {
      console.error('❌ Erro ao criar item:', error);
      handleErrors(res, error, "store");
    }
  },

  // 🔍 Buscar item específico
  async show(req, res) {
    try {
      const { id } = req.params;
      const itemId = Number(id);

      console.log('🔍 Buscando item:', itemId);

      if (isNaN(itemId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const item = await prisma.inventarios.findUnique({
        where: { id: itemId },
        include: {
          itens: true
        }
      });

      if (!item) {
        console.log('❌ Item não encontrado:', itemId);
        return res.status(404).json({ error: 'Registro no inventário não encontrado' });
      }

      res.json(item);
    } catch (error) {
      console.error('❌ Erro ao buscar item:', error);
      handleErrors(res, error, "show");
    }
  },

  // ✏️ Atualizar item
  async update(req, res) {
    try {
      const { id } = req.params;
      const itemId = Number(id);
      const data = inventarioSchema.parse(req.body);

      console.log('✏️ Atualizando item:', itemId);

      if (isNaN(itemId)) {
        return res.status(400).json({ error: "ID do inventário inválido" });
      }

      const itemExistente = await prisma.inventarios.findUnique({
        where: { id: itemId }
      });

      if (!itemExistente) {
        console.log('❌ Item não encontrado:', itemId);
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

      console.log('✅ Item atualizado:', itemAtualizado.id);
      res.json(itemAtualizado);
    } catch (error) {
      console.error('❌ Erro ao atualizar item:', error);
      handleErrors(res, error, "update");
    }
  },

  // 💰 Atualizar dinheiro
  async updateDinheiro(req, res) {
    try {
      const { id } = req.params;
      const itemId = Number(id);
      const { operacao, valor } = req.body;

      console.log(`💰 Atualizando dinheiro: item=${itemId}, operacao=${operacao}, valor=${valor}`);

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
        console.log('❌ Item não encontrado:', itemId);
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      if (itemExistente.tipo !== 'Moeda') {
        console.log('❌ Item não é moeda:', itemExistente.tipo);
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

      console.log('✅ Dinheiro atualizado:', atualizado.id, 'nova quantidade:', novaQuantidade);
      res.json(atualizado);
    } catch (error) {
      console.error('❌ Erro ao atualizar dinheiro:', error);
      handleErrors(res, error, "updateDinheiro");
    }
  },

  // 🗑️ Deletar item
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const itemId = Number(id);

      console.log('🗑️ Deletando item:', itemId);

      if (isNaN(itemId)) {
        return res.status(400).json({ error: "ID inválido" });
      }

      const itemExistente = await prisma.inventarios.findUnique({
        where: { id: itemId }
      });

      if (!itemExistente) {
        console.log('❌ Item não encontrado:', itemId);
        return res.status(404).json({ error: 'Item não encontrado' });
      }

      await prisma.inventarios.delete({
        where: { id: itemId }
      });

      console.log('✅ Item deletado:', itemId);
      res.status(204).send();
    } catch (error) {
      console.error('❌ Erro ao deletar item:', error);
      handleErrors(res, error, "destroy");
    }
  },

  // 📊 Estatísticas do inventário
  async stats(req, res) {
    try {
      const { capituloId } = req.query;

      console.log('📊 Buscando stats para capituloId:', capituloId);

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

      console.log('✅ Stats calculadas:', { totalItems, totalMoedas });
      res.json({
        totalItems,
        totalMoedas,
        tipos,
        items
      });
    } catch (error) {
      console.error('❌ Erro ao buscar stats:', error);
      handleErrors(res, error, "stats");
    }
  },

  // 🔥 Verificar se capítulo tem inventário
  async checkExists(req, res) {
    try {
      const capituloId = req.params.capituloId || req.params.id;

      console.log('🔍 Verificando se capítulo tem inventário:', capituloId);

      if (!capituloId) {
        return res.status(400).json({ error: 'ID do capítulo é obrigatório' });
      }

      const cId = Number(capituloId);
      if (isNaN(cId)) {
        return res.status(400).json({ error: 'ID do capítulo inválido' });
      }
      
      const items = await prisma.inventarios.findMany({
        where: { capitulo_id: cId },
        take: 1
      });

      console.log(`✅ Capítulo ${cId} ${items.length > 0 ? 'tem' : 'não tem'} inventário`);
      res.json({
        exists: items.length > 0,
        capitulo_id: cId
      });
    } catch (error) {
      console.error('❌ Erro ao verificar inventário:', error);
      handleErrors(res, error, "checkExists");
    }
  }
};

// 🛠️ Função para tratamento de erros
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
    return res.status(404).json({ error: 'Registro não encontrado' });
  }

  if (error.code === 'P2003') {
    return res.status(400).json({
      error: 'Violação de chave estrangeira',
      message: 'O id do capítulo ou id do item informado não existe.'
    });
  }

  if (error.code === 'P2000') {
    return res.status(400).json({
      error: 'Dado muito longo',
      message: 'Um dos campos excede o tamanho máximo permitido.'
    });
  }

  console.error(`❌ Erro no Inventário (${context}):`, error);
  
  return res.status(500).json({
    error: 'Erro interno no servidor',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Ocorreu um erro inesperado',
    context: context
  });
}

export default inventarioController;