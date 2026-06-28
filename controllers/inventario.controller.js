import prisma from '../lib/prisma.js';
import { inventarioSchema } from '../validator/inventario.validator.js';
import { ZodError } from 'zod';

const inventarioController = {
  async index(req, res) {
    try {
      const { historicoId } = req.query;

      if (!historicoId) {
        const items = await prisma.inventarios.findMany({ 
          orderBy: { nome: 'asc' } 
        });
        return res.json(items);
      }

      const hId = Number(historicoId);
      let items = await prisma.inventarios.findMany({
        where: { historico_id: hId },
        orderBy: { nome: 'asc' }
      });

      // Cria moeda padrão se não existir
      const temMoeda = items.some(item => item.tipo === 'Moeda');
      if (!temMoeda) {
        const novaMoeda = await prisma.inventarios.create({
          data: {
            nome: 'Aether',
            tipo: 'Moeda',
            quantidade: 0,
            historico_id: hId,
            subtipo: 'Dinheiro',
            descricao: 'Dinheiro usado na dimensão de Aetheris'
          }
        });
        items.push(novaMoeda);
        items.sort((a, b) => a.nome.localeCompare(b.nome));
      }

      res.json(items);
    } catch (error) {
      handleErrors(res, error, "index");
    }
  },

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

      if (itemExistente) {
        const novaQuantidade = Number(itemExistente.quantidade) + data.quantidade;
        const atualizado = await prisma.inventarios.update({
          where: { id: itemExistente.id },
          data: {
            quantidade: novaQuantidade,
            descricao: data.descricao || itemExistente.descricao
          }
        });
        return res.json(atualizado);
      }

      const novoItem = await prisma.inventarios.create({ data });
      res.status(201).json(novoItem);
    } catch (error) {
      handleErrors(res, error, "store");
    }
  },

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
          historico: true,
          itens: true
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

  async update(req, res) {
    try {
      const { id } = req.params;
      const data = inventarioSchema.parse(req.body);

      const itemInventario = await prisma.inventarios.update({
        where: { id: Number(id) },
        data
      });

      res.json(itemInventario);
    } catch (error) {
      handleErrors(res, error, "update");
    }
  },

  async updateDinheiro(req, res) {
    try {
      const { id } = req.params;
      const { operacao, valor } = req.body;

      const itemExistente = await prisma.inventarios.findUnique({
        where: { id: Number(id) }
      });

      if (!itemExistente || itemExistente.tipo !== 'Moeda') {
        return res.status(400).json({ error: 'Registro de Moeda inválido' });
      }

      let novaQuantidade = Number(itemExistente.quantidade);
      const valorAlteracao = Number(valor);

      if (operacao === 'adicionar' || operacao === 'somar') {
        novaQuantidade += valorAlteracao;
      } else if (operacao === 'remover' || operacao === 'subtrair') {
        if (novaQuantidade < valorAlteracao) {
          return res.status(400).json({ error: 'Saldo insuficiente' });
        }
        novaQuantidade -= valorAlteracao;
      } else if (operacao === 'fixo') {
        novaQuantidade = valorAlteracao;
      } else {
        return res.status(400).json({ error: 'Operação inválida' });
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

  async destroy(req, res) {
    try {
      const { id } = req.params;
      await prisma.inventarios.delete({
        where: { id: Number(id) }
      });
      res.status(204).send();
    } catch (error) {
      handleErrors(res, error, "destroy");
    }
  }
};

function handleErrors(res, error, context) {
  if (error instanceof ZodError) {
    return res.status(400).json({ 
      error: "Dados inválidos", 
      detalhes: error.errors 
    });
  }
  if (error.code === 'P2025') {
    return res.status(404).json({ 
      error: 'Registro no inventário não encontrado' 
    });
  }
  console.error(`❌ Erro Prisma (Inventário - ${context}):`, error);
  return res.status(500).json({ error: 'Erro interno no servidor' });
}

export default inventarioController;