import { prisma } from "../lib/prisma.js";
import ftpService from "../services/ftp.service.js";
import { itemSchema } from "../validator/itens.validator.js";
import { ZodError } from "zod";

// Utilitário para BigInt e Datas
const toJSON = (obj) => JSON.parse(JSON.stringify(obj, (key, value) =>
  typeof value === "bigint" ? value.toString() : value
));

const handleError = (error, res) => {
  if (error instanceof ZodError) {
    return res.status(400).json({ message: "Erro de validação", errors: error.errors });
  }
  console.error("❌ Erro detalhado no itensController:", error);
  return res.status(500).json({ error: error.message || "Erro interno no servidor" });
};

const itensController = {
  async index(req, res) {
    try {
      const itens = await prisma.itens.findMany({
        orderBy: { createdAt: "desc" },
      });
      res.json(toJSON(itens));
    } catch (error) {
      handleError(error, res);
    }
  },

  async show(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "O parâmetro ID do item é obrigatório e deve ser um número válido." });
      }

      const item = await prisma.itens.findUnique({
        where: { id_item: Number(id) },
      });

      if (!item) return res.status(404).json({ error: "Item não encontrado" });
      res.json(toJSON(item));
    } catch (error) {
      handleError(error, res);
    }
  },

  async store(req, res) {
    try {
      const corpoFormatado = { ...req.body };

      // 1. Tratamento seguro de strings para JSON
      try {
        if (typeof corpoFormatado.listaHabilidades === "string") {
          corpoFormatado.listaHabilidades = JSON.parse(corpoFormatado.listaHabilidades);
        }
      } catch (e) {
        corpoFormatado.listaHabilidades = [];
      }

      try {
        if (typeof corpoFormatado.usuarios === "string") {
          corpoFormatado.usuarios = JSON.parse(corpoFormatado.usuarios);
        }
      } catch (e) {
        corpoFormatado.usuarios = null;
      }

      // 2. Validação via Zod (com o validador que removeu o .url())
      const dadosValidados = itemSchema.parse(corpoFormatado);

      // Garantia absoluta de que listaHabilidades nunca vá nula ou undefined para o banco
      if (!dadosValidados.listaHabilidades) {
        dadosValidados.listaHabilidades = [];
      }

      // 3. Processamento do arquivo físico pelo serviço FTP
      let urlImagem = null;
      if (req.file) {
        const nomeLimpo = dadosValidados.nome ? dadosValidados.nome.replace(/\s+/g, "_") : "item";
        urlImagem = await ftpService.uploadFile(req.file, "itens", nomeLimpo);
      }

      // 4. Montagem segura dos dados para o Prisma
      const novoItem = await prisma.itens.create({
        data: {
          nome: dadosValidados.nome,
          tipo: dadosValidados.tipo,
          descricao: dadosValidados.descricao || null,
          aparencia: dadosValidados.aparencia || null,
          listaHabilidades: dadosValidados.listaHabilidades,
          usuarios: dadosValidados.usuarios || null,
          urlImagem: urlImagem, // Injeta a URL salva do FTP
          createdAt: new Date()
        },
      });

      res.status(201).json(toJSON(novoItem));
    } catch (error) {
      handleError(error, res);
    }
  },

  async update(req, res) {
    try {
      const { id } = req.params;
      if (!id || isNaN(Number(id))) {
        return res.status(400).json({ error: "O parâmetro ID do item é obrigatório e deve ser um número válido." });
      }

      const atual = await prisma.itens.findUnique({ where: { id_item: Number(id) } });
      if (!atual) return res.status(404).json({ error: "Item não encontrado" });

      const corpoFormatado = { ...req.body };

      // 1. Tratamento seguro de strings para JSON
      try {
        if (typeof corpoFormatado.listaHabilidades === "string") {
          corpoFormatado.listaHabilidades = JSON.parse(corpoFormatado.listaHabilidades);
        }
      } catch (e) {
        corpoFormatado.listaHabilidades = atual.listaHabilidades || [];
      }

      try {
        if (typeof corpoFormatado.usuarios === "string") {
          corpoFormatado.usuarios = JSON.parse(corpoFormatado.usuarios);
        }
      } catch (e) {
        corpoFormatado.usuarios = atual.usuarios || null;
      }

      // 2. Validação via Zod
      const dadosValidados = itemSchema.parse(corpoFormatado);

      if (!dadosValidados.listaHabilidades) {
        dadosValidados.listaHabilidades = atual.listaHabilidades || [];
      }

      // 3. Processamento da imagem no FTP
      let urlImagem = atual.urlImagem;
      if (req.file) {
        // Se houver uma imagem antiga, remove do FTP para não acumular lixo
        if (atual.urlImagem) {
          await ftpService.deleteFile(atual.urlImagem);
        }
        const nomeLimpo = (dadosValidados.nome || atual.nome).replace(/\s+/g, "_");
        urlImagem = await ftpService.uploadFile(req.file, "itens", nomeLimpo);
      }

      // 4. Update estruturado no Banco de Dados
      const atualizado = await prisma.itens.update({
        where: { id_item: Number(id) },
        data: {
          nome: dadosValidados.nome,
          tipo: dadosValidados.tipo,
          descricao: dadosValidados.descricao !== undefined ? dadosValidados.descricao : atual.descricao,
          aparencia: dadosValidados.aparencia !== undefined ? dadosValidados.aparencia : atual.aparencia,
          listaHabilidades: dadosValidados.listaHabilidades,
          usuarios: dadosValidados.usuarios !== undefined ? dadosValidados.usuarios : atual.usuarios,
          urlImagem: urlImagem,
        },
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
        return res.status(400).json({ error: "O parâmetro ID do item é obrigatório e deve ser um número válido." });
      }

      const atual = await prisma.itens.findUnique({ where: { id_item: Number(id) } });
      if (!atual) return res.status(404).json({ error: "Item não encontrado" });

      // Remove a imagem associada do FTP antes de apagar o item do banco
      if (atual.urlImagem) {
        await ftpService.deleteFile(atual.urlImagem);
      }

      await prisma.itens.delete({ where: { id_item: Number(id) } });
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  }
};

export default itensController;