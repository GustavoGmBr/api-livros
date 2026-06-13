import prisma from "../lib/prisma.js";
import { capituloSchema } from "../validator/capitulo.validator.js";

// Serializador para evitar problemas com BigInt e dados complexos
const toJSON = (data) =>
  JSON.parse(JSON.stringify(data, (key, value) => (typeof value === "bigint" ? value.toString() : value)));

// Centralização de erros exibindo detalhes no terminal
const handleError = (res, error) => {
  console.error("💥 ERRO DETECTADO NO CONTROLLER:", error);
  return res.status(500).json({ error: error.message || "Erro interno no servidor" });
};

const capituloController = {
  // GET /capitulos/livro/:livro_id
  async listarPorLivro(req, res) {
    try {
      const { livro_id } = req.params;

      const capitulos = await prisma.capitulos.findMany({
        where: {
          livro_id: Number(livro_id),
          parent_id: null
        },
        orderBy: { numero: "asc" },
        include: {
          children: {
            orderBy: { numero: "asc" }
          }
        }
      });

      return res.json(toJSON(capitulos));
    } catch (error) {
      return handleError(res, error);
    }
  },

  // GET /capitulos/:id
  async show(req, res) {
    try {
      const { id } = req.params;
      const idNumerico = !isNaN(Number(id)) ? Number(id) : undefined;

      const capitulo = await prisma.capitulos.findFirst({
        where: {
          OR: [
            ...(idNumerico ? [{ id: idNumerico }] : []),
            { titulo: id }
          ]
        },
        // ✨ ADICIONE ESTA LINHA AQUI PARA TRAZER OS SUBCAPÍTULOS:
        include: {
          children: {
            orderBy: { numero: "asc" } // Já traz ordenadinho por número
          }
        }
      });

      if (!capitulo) {
        return res.status(404).json({ error: "Capítulo não encontrado" });
      }

      // ... resto do seu código de extração de participantes (pIds, lIds, iIds)

      return res.json(toJSON({
        ...capitulo,
        personagens_detalhes: personagens,
        locais_detalhes: locais,
        itens_detalhes: itens
      }));
    } catch (error) {
      return handleError(res, error);
    }
  },

  // POST /capitulos
  async store(req, res) {
    try {
      const validatedData = capituloSchema.parse(req.body);

      const novoCapitulo = await prisma.capitulos.create({
        data: {
          numero: Number(validatedData.numero),
          titulo: validatedData.titulo,
          livro_id: Number(validatedData.livro_id),
          parent_id: validatedData.parent_id ? Number(validatedData.parent_id) : null,
          personagens_participantes: validatedData.personagens_participantes || null,
          formas_participantes: validatedData.formas_participantes || null,
          itens_participantes: validatedData.itens_participantes || null,
          locais_participantes: validatedData.locais_participantes || null,
          conteudo_json: validatedData.conteudo_json || null
        }
      });

      return res.status(201).json(toJSON(novoCapitulo));
    } catch (error) {
      return handleError(res, error);
    }
  },

  // PUT /capitulos/:id
  async update(req, res) {
    try {
      const { id } = req.params;
      const validatedData = capituloSchema.parse(req.body);

      const atualizado = await prisma.capitulos.update({
        where: { id: Number(id) },
        data: {
          numero: Number(validatedData.numero),
          titulo: validatedData.titulo,
          livro_id: Number(validatedData.livro_id),
          parent_id: validatedData.parent_id ? Number(validatedData.parent_id) : null,
          personagens_participantes: validatedData.personagens_participantes,
          formas_participantes: validatedData.formas_participantes,
          itens_participantes: validatedData.itens_participantes,
          locais_participantes: validatedData.locais_participantes,
          conteudo_json: validatedData.conteudo_json
        }
      });

      return res.json(toJSON(atualizado));
    } catch (error) {
      return handleError(res, error);
    }
  },

  // GET /capitulos/recentes
  async listarRecentes(req, res) {
    try {
      const recentes = await prisma.capitulos.findMany({
        take: 10,
        orderBy: { id: "desc" }
      });
      return res.json(toJSON(recentes));
    } catch (error) {
      return handleError(res, error);
    }
  },

  // PATCH/PUT /capitulos/:id/conteudo
  async updateConteudo(req, res) {
    try {
      const { id } = req.params;
      const { conteudo_json } = req.body;

      if (!conteudo_json) {
        return res.status(400).json({ error: "O parâmetro conteudo_json é obrigatório." });
      }

      let idFinal = !isNaN(Number(id)) ? Number(id) : null;

      // Se o ID enviado for uma string (nome/titulo), busca o ID real do capítulo correspondente
      if (!idFinal) {
        const capituloCorrespondente = await prisma.capitulos.findFirst({
          where: { titulo: id }
        });
        if (!capituloCorrespondente) {
          return res.status(404).json({ error: "Não foi possível mapear o identificador do capítulo para salvamento." });
        }
        idFinal = capituloCorrespondente.id;
      }

      const dadosTratados = typeof conteudo_json === 'string'
        ? JSON.parse(conteudo_json)
        : conteudo_json;

      const atualizado = await prisma.capitulos.update({
        where: { id: idFinal },
        data: { conteudo_json: dadosTratados }
      });

      return res.json(toJSON({
        message: "Grimório preservado com sucesso!",
        data: atualizado
      }));
    } catch (error) {
      return handleError(res, error);
    }
  },
  // DELETE /capitulos/:id
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const idNumerico = Number(id);

      if (isNaN(idNumerico)) {
        return res.status(400).json({ error: "ID inválido para exclusão." });
      }

      // Verifica se o capítulo existe antes de deletar
      const existe = await prisma.capitulos.findUnique({
        where: { id: idNumerico }
      });

      if (!existe) {
        return res.status(404).json({ error: "Capítulo ou subcapítulo não encontrado." });
      }

      // O Prisma cuidará dos subcapítulos automaticamente se o "onDelete: Cascade" estiver ativo no banco.
      // Caso contrário, ele impedirá a deleção se houver filhos, garantindo a integridade.
      await prisma.capitulos.delete({
        where: { id: idNumerico }
      });

      return res.json({ message: "Capítulo/Subcapítulo removido com sucesso de seus registros!" });
    } catch (error) {
      return handleError(res, error);
    }
  },

  // PATCH /capitulos/:id/limpar-conteudo
  async destroyConteudo(req, res) {
    try {
      const { id } = req.params;
      let idFinal = !isNaN(Number(id)) ? Number(id) : null;

      // Se passarem o título em vez do ID, mapeia o ID correto
      if (!idFinal) {
        const capituloCorrespondente = await prisma.capitulos.findFirst({
          where: { titulo: id }
        });
        if (!capituloCorrespondente) {
          return res.status(404).json({ error: "Capítulo não encontrado para limpar o conteúdo." });
        }
        idFinal = capituloCorrespondente.id;
      }

      // Atualiza o conteúdo json e os arrays de participantes para nulo/vazio
      const atualizado = await prisma.capitulos.update({
        where: { id: idFinal },
        data: {
          conteudo_json: null,
          personagens_participantes: null,
          formas_participantes: null,
          itens_participantes: null,
          locais_participantes: null
        }
      });

      return res.json(toJSON({
        message: "Páginas do grimório limpas com sucesso. O esqueleto do capítulo foi mantido.",
        data: atualizado
      }));
    } catch (error) {
      return handleError(res, error);
    }
  }
};

export default capituloController;