import prisma from "../lib/prisma.js";
import { capituloSchema } from "../validator/capitulo.validator.js";

const toJSON = (data) => JSON.parse(JSON.stringify(data, (key, value) => (typeof value === "bigint" ? value.toString() : value)));

// Trata os erros e exibe no console para você saber exatamente o que falhou
const handleError = (res, error) => {
  console.error("💥 ERRO DETECTADO NO CONTROLLER:", error);
  return res.status(500).json({ error: error.message || "Erro interno no servidor" });
};

const capituloController = {
  async listarPorLivro(req, res) {
    try {
      // ✨ AJUSTE: Pegando 'livroId' para bater com o que você colocou na sua rota pública (/:livroId)
      const { livroId } = req.params;
      const capitulos = await prisma.capitulos.findMany({
        where: { livro_id: Number(livroId), parent_id: null },
        orderBy: { numero: "asc" },
        include: { children: { orderBy: { numero: "asc" } } }
      });
      res.json(toJSON(capitulos));
    } catch (error) { handleError(res, error); }
  },

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
        }
      });

      if (!capitulo) return res.status(404).json({ error: "Capítulo não encontrado" });

      const conteudo = capitulo.conteudo_json || {};
      const pIds = [...new Set(conteudo.personagens_participantes || [])];
      const lIds = [...new Set(conteudo.locais_participantes || [])];
      const iIds = [...new Set(conteudo.itens_participantes || [])];

      const [personagens, locais, itens] = await Promise.all([
        prisma.personagens.findMany({ where: { id: { in: pIds } }, select: { id: true, nome: true, imagemRosto: true } }),
        prisma.locais.findMany({ where: { id: { in: lIds } }, select: { id: true, nome: true } }),
        prisma.itens.findMany({ where: { id: { in: iIds } }, select: { id: true, nome: true } })
      ]);

      res.json(toJSON({ ...capitulo, personagens_detalhes: personajes, locais_detalhes: locais, itens_detalhes: itens }));
    } catch (error) { handleError(res, error); }
  },

  async store(req, res) {
    try {
      const validatedData = capituloSchema.parse(req.body);

      const novo = await prisma.capitulos.create({
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

      res.status(201).json(toJSON(novo));
    } catch (error) { handleError(res, error); }
  },

  async update(req, res) {
    try {
      const validatedData = capituloSchema.parse(req.body);

      const atualizado = await prisma.capitulos.update({
        where: { id: Number(req.params.id) },
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

      res.json(toJSON(atualizado));
    } catch (error) { handleError(res, error); }
  },

  async listarRecentes(req, res) {
    try {
      const recentes = await prisma.capitulos.findMany({ take: 10, orderBy: { id: "desc" } });
      res.json(toJSON(recentes));
    } catch (error) { handleError(res, error); }
  },

  async updateConteudo(req, res) {
    try {
      const { id } = req.params;
      const { conteudo_json } = req.body;

      // RASTREADOR 1: O que está chegando do Frontend?
      console.log("----------------------------------------------");
      console.log("📥 [RECEBIDO] ID da URL:", id);
      console.log("📥 [RECEBIDO] Corpo (conteudo_json):", conteudo_json);

      if (!conteudo_json) {
        return res.status(400).json({ error: "O parâmetro conteudo_json é obrigatório." });
      }

      let idFinal = !isNaN(Number(id)) ? Number(id) : null;

      if (!idFinal) {
        const capituloCorrespondente = await prisma.capitulos.findFirst({
          where: { titulo: id }
        });
        if (!capituloCorrespondente) {
          console.log("❌ [AVISO] Capítulo não encontrado pelo título:", id);
          return res.status(404).json({ error: "Não foi possível mapear o identificador do capítulo para salvamento." });
        }
        idFinal = capituloCorrespondente.id;
      }

      // RASTREADOR 2: Qual ID o Prisma vai realmente atualizar?
      console.log("🎯 [ALVO] O Prisma vai atualizar o registro com ID número:", idFinal);

      const dadosTratados = typeof conteudo_json === 'string'
        ? JSON.parse(conteudo_json)
        : conteudo_json;

      const atualizado = await prisma.capitulos.update({
        where: { id: Number(idFinal) },
        data: { conteudo_json: dadosTratados }
      });

      // RASTREADOR 3: O que o MySQL devolveu após salvar?
      console.log("💾 [BANCO DE DADOS] Registro atualizado com sucesso no MySQL. Resultado atual:", atualizado);
      console.log("----------------------------------------------");

      res.json(toJSON({
        message: "Grimório preservado com sucesso!",
        data: atualizado
      }));

    } catch (error) { handleError(res, error); }
  },
  // ✨ NOVO MÉTODO: Criado para dar suporte à sua rota privada de exclusão
  async destroy(req, res) {
    try {
      const { id } = req.params;
      const deletado = await prisma.capitulos.delete({
        where: { id: Number(id) }
      });
      res.json(toJSON({ message: "Capítulo deletado com sucesso", data: deletado }));
    } catch (error) { handleError(res, error); }
  }
};

export default capituloController;