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
  console.error("❌ Erro no itensController:", error);
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

      // 🛡️ VALIDAÇÃO: Impede que o ID seja undefined, nulo ou não-numérico
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
      // Validação dos dados textuais
      const dadosValidados = itemSchema.parse(req.body);

      if (req.body.listaHabilidades) {
        dadosValidados.listaHabilidades =
          typeof req.body.listaHabilidades === "string"
            ? JSON.parse(req.body.listaHabilidades)
            : req.body.listaHabilidades;
      }

      if (req.body.usuarios) {
        dadosValidados.usuarios =
          typeof req.body.usuarios === "string"
            ? JSON.parse(req.body.usuarios)
            : req.body.usuarios;
      }

      let urlImagem = null;

      if (req.file) {
        const nomeLimpo = dadosValidados.nome ? dadosValidados.nome.replace(/\s+/g, "_") : "item";
        urlImagem = await ftpService.uploadFile(req.file, "itens", nomeLimpo);
      }

      const novoItem = await prisma.itens.create({
        data: {
          ...dadosValidados,
          urlImagem,
          createdAt: new Date(),
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

      const dadosValidados = itemSchema.parse(req.body);

      if (req.body.listaHabilidades) {
        dadosValidados.listaHabilidades =
          typeof req.body.listaHabilidades === "string"
            ? JSON.parse(req.body.listaHabilidades)
            : req.body.listaHabilidades;
      }

      if (req.body.usuarios) {
        dadosValidados.usuarios =
          typeof req.body.usuarios === "string"
            ? JSON.parse(req.body.usuarios)
            : req.body.usuarios;
      }

      let urlImagem = atual.urlImagem;

      if (req.file) {
        const nomeLimpo = (dadosValidados.nome || atual.nome) 
          ? (dadosValidados.nome || atual.nome).replace(/\s+/g, "_") 
          : "item";
        urlImagem = await ftpService.uploadFile(req.file, "itens", nomeLimpo);
      }

      const atualizado = await prisma.itens.update({
        where: { id_item: Number(id) },
        data: {
          ...dadosValidados,
          urlImagem,
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

      await prisma.itens.delete({ where: { id_item: Number(id) } });
      res.status(204).send();
    } catch (error) {
      handleError(error, res);
    }
  }
};

export default itensController;