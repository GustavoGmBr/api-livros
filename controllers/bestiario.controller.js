import { prisma } from '../lib/prisma.js';
import ftpService from '../services/ftp.service.js';
import { bestiarioSchema } from '../validator/bestiario.validator.js'; // Ajuste o caminho se necessário
import { ZodError } from 'zod';

// Utilitário para BigInt e Datas
const toJSON = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
  typeof value === 'bigint' ? value.toString() : value
));

const handleError = (error, res) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: 'Erro de validação', errors: error.errors });
  }
  console.error('❌ Erro no BestiarioController:', error);
  return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
};

const bestiarioController = {
  async index(req, res) {
    try {
      const { tipo } = req.query; // Permite buscar via: /api/bestiario?tipo=monstro

      const criaturas = await prisma.bestiario.findMany({
        where: tipo ? { tipo: String(tipo) } : {}, // Filtra se o tipo for enviado na URL
        orderBy: { nome: 'asc' }
      });

      res.json(toJSON(criaturas));
    } catch (error) {
      handleError(error, res);
    }
  },

  async store(req, res) {
    try {
      // Validação dos dados textuais e numéricos via Zod
      const dadosValidados = bestiarioSchema.parse(req.body);
      const file = req.file; // .single('bestiario') preenche req.file

      let urlImagem = null;

      if (file) {
        const nomeLimpo = dadosValidados.nome.replace(/\s+/g, '_');
        // Enviando para a pasta 'bestiario' com o nome customizado da criatura
        urlImagem = await ftpService.uploadFile(file, 'bestiario', nomeLimpo);
      }

      const novaCriatura = await prisma.bestiario.create({
        data: {
          ...dadosValidados,
          imagemBestiario: urlImagem
        }
      });

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

      const dadosValidados = bestiarioSchema.parse(req.body);
      const file = req.file;

      const atual = await prisma.bestiario.findUnique({ where: { id: Number(id) } });
      if (!atual) return res.status(404).json({ error: "Criatura não encontrada" });

      let urlImagem = atual.imagemBestiario;

      if (file) {
        const nomeLimpo = (dadosValidados.nome || atual.nome).replace(/\s+/g, '_');
        urlImagem = await ftpService.uploadFile(file, 'bestiario', nomeLimpo);
      }

      const atualizado = await prisma.bestiario.update({
        where: { id: Number(id) },
        data: {
          ...dadosValidados,
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

      // Opcional: Se quiser deletar a imagem do FTP antes de remover do banco:
      const atual = await prisma.bestiario.findUnique({ where: { id: Number(id) } });
      if (atual && atual.imagemBestiario) {
        await ftpService.deleteFile(atual.imagemBestiario);
      }

      await prisma.bestiario.delete({ where: { id: Number(id) } });
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  }
};

export default bestiarioController;