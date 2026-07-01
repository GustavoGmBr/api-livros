// backend/controllers/bestiario.controller.js

import { prisma } from '../lib/prisma.js';
import ftpService from '../services/ftp.service.js';
import { bestiarioSchema } from '../validator/bestiario.validator.js';
import { ZodError } from 'zod';

// Utilitário para BigInt e Datas
const toJSON = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
));

const handleError = (error, res) => {
  if (error instanceof ZodError) {
    console.error('❌ Erro de validação Zod:', error.errors);
    return res.status(400).json({ 
      message: 'Erro de validação', 
      errors: error.errors.map(err => ({
        path: err.path.join('.'),
        message: err.message,
        code: err.code
      }))
    });
  }
  console.error('❌ Erro no BestiarioController:', error);
  return res.status(500).json({ 
    message: 'Erro interno no servidor',
    error: error.message || 'Erro interno no servidor'
  });
};

const bestiarioController = {
  async index(req, res) {
    try {
      const { tipo } = req.query;

      const criaturas = await prisma.bestiario.findMany({
        where: tipo ? { tipo: String(tipo) } : {},
        orderBy: { nome: 'asc' }
      });

      res.json(toJSON(criaturas));
    } catch (error) {
      handleError(error, res);
    }
  },

  async store(req, res) {
    try {
      console.log('📥 [store] req.body:', req.body);
      console.log('📥 [store] req.file:', req.file?.filename || req.file?.originalname || 'Nenhum arquivo');

      // 🔥 CORREÇÃO: Converter strings para números antes da validação
      const body = {
        ...req.body,
        subnivel: req.body.subnivel !== undefined ? Number(req.body.subnivel) : 1,
        nivelMedio: req.body.nivelMedio !== undefined ? Number(req.body.nivelMedio) : 1,
        ponto_combate: req.body.ponto_combate !== undefined ? Number(req.body.ponto_combate) : 0,
        ponto_combateAetheris: req.body.ponto_combateAetheris !== undefined ? Number(req.body.ponto_combateAetheris) : 0,
      };

      console.log('📥 [store] body após conversão:', body);

      // 🔥 Validação dos dados
      const dadosValidados = bestiarioSchema.parse(body);
      console.log('✅ [store] Dados validados:', dadosValidados);

      const file = req.file;
      let urlImagem = null;

      if (file) {
        try {
          const nomeLimpo = dadosValidados.nome.replace(/\s+/g, '_');
          urlImagem = await ftpService.uploadFile(file, 'bestiario', nomeLimpo);
          console.log('✅ [store] URL da imagem gerada:', urlImagem);
        } catch (ftpError) {
          console.error('❌ [store] Erro no FTP:', ftpError);
          urlImagem = null;
        }
      }

      // 🔥 Remover campo sistema_id se existir (não está no schema do Prisma)
      const { sistema_id, ...dadosParaSalvar } = dadosValidados;

      const novaCriatura = await prisma.bestiario.create({
        data: {
          ...dadosParaSalvar,
          imagemBestiario: urlImagem
        }
      });

      console.log('✅ [store] Criatura criada:', novaCriatura.id);
      res.status(201).json(toJSON(novaCriatura));

    } catch (error) {
      handleError(error, res);
    }
  },

  async show(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'O parâmetro ID da criatura é obrigatório e deve ser um número válido.' });
      }

      const criatura = await prisma.bestiario.findUnique({
        where: { id: Number(id) }
      });

      if (!criatura) return res.status(404).json({ error: 'Criatura não encontrada no bestiário' });
      res.json(toJSON(criatura));
    } catch (error) {
      handleError(error, res);
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'O parâmetro ID da criatura é obrigatório e deve ser um número válido.' });
      }

      // 🔥 CORREÇÃO: Converter strings para números antes da validação
      const body = {
        ...req.body,
        subnivel: req.body.subnivel !== undefined ? Number(req.body.subnivel) : 1,
        nivelMedio: req.body.nivelMedio !== undefined ? Number(req.body.nivelMedio) : 1,
        ponto_combate: req.body.ponto_combate !== undefined ? Number(req.body.ponto_combate) : 0,
        ponto_combateAetheris: req.body.ponto_combateAetheris !== undefined ? Number(req.body.ponto_combateAetheris) : 0,
      };

      const dadosValidados = bestiarioSchema.parse(body);
      const file = req.file;

      const atual = await prisma.bestiario.findUnique({ where: { id: Number(id) } });
      if (!atual) return res.status(404).json({ error: "Criatura não encontrada" });

      let urlImagem = atual.imagemBestiario;

      if (file) {
        try {
          const nomeLimpo = (dadosValidados.nome || atual.nome).replace(/\s+/g, '_');
          urlImagem = await ftpService.uploadFile(file, 'bestiario', nomeLimpo);
        } catch (ftpError) {
          console.error('❌ [update] Erro no FTP:', ftpError);
        }
      }

      // 🔥 Remover campo sistema_id se existir (não está no schema do Prisma)
      const { sistema_id, ...dadosParaSalvar } = dadosValidados;

      const atualizado = await prisma.bestiario.update({
        where: { id: Number(id) },
        data: {
          ...dadosParaSalvar,
          imagemBestiario: urlImagem
        }
      });

      res.json(toJSON(atualizado));
    } catch (error) {
      handleError(error, res);
    }
  },

  async destroy(req, res) {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: 'O parâmetro ID é inválido.' });
      }

      const atual = await prisma.bestiario.findUnique({ where: { id: Number(id) } });
      if (atual && atual.imagemBestiario) {
        try {
          await ftpService.deleteFile(atual.imagemBestiario);
        } catch (ftpError) {
          console.error('❌ [destroy] Erro ao deletar imagem do FTP:', ftpError);
        }
      }

      await prisma.bestiario.delete({ where: { id: Number(id) } });
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  }
};

export default bestiarioController;