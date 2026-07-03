import prisma from "../lib/prisma.js";
import { capituloSchema } from "../validator/capitulo.validator.js";
import { ZodError } from "zod";

// Serializador para evitar problemas com BigInt e dados complexos
const toJSON = (data) =>
  JSON.parse(JSON.stringify(data, (key, value) => (typeof value === "bigint" ? value.toString() : value)));

// Centralização de erros inteligente
const handleError = (res, error) => {
  console.error("💥 ERRO DETECTADO NO CONTROLLER:", error);

  if (error instanceof ZodError) {
    return res.status(400).json({ error: "Erro de validação nos dados enviados", detalhes: error.errors });
  }

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
      const idNumerico = !isNaN(Number(id)) ? Number(id) : null;

      const capitulo = await prisma.capitulos.findFirst({
        where: idNumerico
          ? { id: idNumerico }
          : { titulo: id },
        include: {
          children: {
            orderBy: { numero: 'asc' }
          }
        }
      });

      if (!capitulo) {
        return res.status(404).json({ error: "Capítulo não encontrado" });
      }

      const parseIds = (field) => {
        if (!field) return [];
        if (Array.isArray(field)) return field.map(Number).filter(Boolean);
        try {
          const parsed = typeof field === 'string' ? JSON.parse(field) : field;
          return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
        } catch {
          return [];
        }
      };

      const pIds = parseIds(capitulo.personagens_participantes);
      const fIds = parseIds(capitulo.formas_participantes);
      const lIds = parseIds(capitulo.locais_participantes);
      const iIds = parseIds(capitulo.itens_participantes);
      const cIds = parseIds(capitulo.criaturas_participantes); // <-- NOVO: IDs das criaturas

      const [personagens, formas, locais, itens, criaturas] = await Promise.all([
        pIds.length > 0
          ? prisma.personagens.findMany({
            where: { id: { in: pIds } },
            select: { id: true, nome: true, imagemRosto: true }
          })
          : [],
        fIds.length > 0
          ? prisma.personagem_forma.findMany({
            where: { id: { in: fIds } },
            select: { id: true, nome: true, personagem_id: true }
          })
          : [],
        lIds.length > 0
          ? prisma.locais.findMany({
            where: { id: { in: lIds } },
            select: { id: true, nome: true }
          })
          : [],
        iIds.length > 0
          ? prisma.itens.findMany({
            where: { id_item: { in: iIds } },
            select: { id_item: true, nome: true }
          })
          : [],
        cIds.length > 0 // <-- NOVO: Busca das criaturas
          ? prisma.bestiario.findMany({
            where: { id: { in: cIds } },
            select: {
              id: true,
              nome: true,
              tipo: true,
              ranque: true,
              subnivel: true,
              imagemBestiario: true,
              classificacao: true,
              nivelMedio: true
            }
          })
          : []
      ]);

      return res.json(toJSON({
        ...capitulo,
        personagens_detalhes: personagens,
        formas_detalhes: formas,
        locais_detalhes: locais,
        itens_detalhes: itens,
        criaturas_detalhes: criaturas // <-- NOVO: Detalhes das criaturas
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
          criaturas_participantes: validatedData.criaturas_participantes || null, // <-- NOVO
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

      console.log('🔍 Atualizando capítulo ID:', id);
      console.log('📦 Dados recebidos:', JSON.stringify(req.body, null, 2));

      // Validação mais flexível
      let validatedData;
      try {
        validatedData = capituloSchema.partial().parse(req.body);
      } catch (validationError) {
        console.error('❌ Erro de validação:', validationError);
        return res.status(400).json({
          error: 'Dados inválidos',
          detalhes: validationError.errors
        });
      }

      // Normaliza os dados
      const data = {};

      // Mapeia apenas os campos que foram enviados
      const fields = [
        'numero', 'titulo', 'livro_id', 'parent_id',
        'personagens_participantes', 'formas_participantes',
        'itens_participantes', 'locais_participantes',
        'criaturas_participantes', 'conteudo_json'
      ];

      fields.forEach(field => {
        if (validatedData[field] !== undefined) {
          // Se for array e estiver vazio, converte para null
          if (Array.isArray(validatedData[field]) && validatedData[field].length === 0) {
            data[field] = null;
          } else {
            data[field] = validatedData[field];
          }
        }
      });

      // Converte IDs para número
      if (data.numero !== undefined) data.numero = Number(data.numero);
      if (data.livro_id !== undefined) data.livro_id = Number(data.livro_id);
      if (data.parent_id !== undefined) data.parent_id = data.parent_id ? Number(data.parent_id) : null;

      console.log('📝 Dados processados para update:', JSON.stringify(data, null, 2));

      // Verifica se o capítulo existe
      const existe = await prisma.capitulos.findUnique({
        where: { id: Number(id) }
      });

      if (!existe) {
        return res.status(404).json({ error: 'Capítulo não encontrado' });
      }

      const atualizado = await prisma.capitulos.update({
        where: { id: Number(id) },
        data
      });

      console.log('✅ Capítulo atualizado com sucesso:', atualizado.id);

      return res.json(toJSON(atualizado));

    } catch (error) {
      console.error('💥 ERRO NO UPDATE:');
      console.error('📌 Mensagem:', error.message);
      console.error('📌 Stack:', error.stack);

      if (error.code === 'P2025') {
        return res.status(404).json({ error: 'Capítulo não encontrado' });
      }

      return handleError(res, error);
    }
  },

  // GET /capitulos/recentes
  async listarRecentes(req, res) {
    try {
      const GridRecent = await prisma.capitulos.findMany({
        take: 10,
        orderBy: { id: "desc" }
      });
      return res.json(toJSON(GridRecent));
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

      const existe = await prisma.capitulos.findUnique({
        where: { id: idNumerico }
      });

      if (!existe) {
        return res.status(404).json({ error: "Capítulo ou subcapítulo não encontrado." });
      }

      await prisma.capitulos.delete({
        where: { id: idNumerico }
      });

      return res.json({ message: "Capítulo/Subcapítulo removido com sucesso de seus registros!" });
    } catch (error) {
      return handleError(res, error);
    }
  },
  // GET /capitulos - Versão MAIS COMPLETA
  async listarTodos(req, res) {
    try {
      const { page = 1, limit = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);
      const take = Number(limit);

      const [capitulos, total] = await Promise.all([
        prisma.capitulos.findMany({
          skip,
          take,
          orderBy: [
            { livro_id: "asc" },
            { numero: "asc" }
          ],
          include: {
            // Dados completos do livro
            livros: {
              include: {
                saga: {
                  select: {
                    id: true,
                    nome: true,
                    descricao: true
                  }
                }
              }
            },
            // Subcapítulos (filhos)
            children: {
              orderBy: { numero: "asc" },
              include: {
                children: {  // Netos (sub-subcapítulos)
                  orderBy: { numero: "asc" }
                }
              }
            },
            // Capítulo pai (se for subcapítulo)
            parent: {
              select: {
                id: true,
                numero: true,
                titulo: true
              }
            },
            // Inventários associados
            inventarios: {
              include: {
                itens: {
                  select: {
                    id_item: true,
                    nome: true,
                    tipo: true,
                    descricao: true,
                    aparencia: true,
                    listaHabilidades: true,
                    urlImagem: true
                  }
                }
              }
            },
            // Históricos de personagens neste capítulo
            personagemHistoricos: {
              include: {
                personagem: {
                  select: {
                    id: true,
                    nome: true,
                    titulo: true,
                    mundo_origem: true,
                    classe: true,
                    afiliacao: true,
                    imagemRosto: true,
                    imagemCorpo: true
                  }
                },
                raca: {
                  select: {
                    id: true,
                    nome: true,
                    mundo: true,
                    sistema: {
                      select: {
                        id: true,
                        nome: true
                      }
                    }
                  }
                },
                livro: {
                  select: {
                    id: true,
                    titulo: true
                  }
                }
              }
            }
          }
        }),
        prisma.capitulos.count()
      ]);

      // Processar cada capítulo para incluir detalhes dos participantes
      const capitulosComDetalhes = await Promise.all(
        capitulos.map(async (capitulo) => {
          // Parse dos IDs dos participantes
          const parseIds = (field) => {
            if (!field) return [];
            if (Array.isArray(field)) return field.map(Number).filter(Boolean);
            try {
              const parsed = typeof field === 'string' ? JSON.parse(field) : field;
              return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
            } catch {
              return [];
            }
          };

          const pIds = parseIds(capitulo.personagens_participantes);
          const fIds = parseIds(capitulo.formas_participantes);
          const lIds = parseIds(capitulo.locais_participantes);
          const iIds = parseIds(capitulo.itens_participantes);
          const cIds = parseIds(capitulo.criaturas_participantes);

          // Buscar todos os detalhes dos participantes
          const [personagens, formas, locais, itens, criaturas] = await Promise.all([
            pIds.length > 0
              ? prisma.personagens.findMany({
                where: { id: { in: pIds } },
                select: {
                  id: true,
                  nome: true,
                  titulo: true,
                  mundo_origem: true,
                  classe: true,
                  afiliacao: true,
                  imagemRosto: true,
                  imagemCorpo: true,
                  formas: {
                    select: {
                      id: true,
                      nome: true,
                      ranque: true,
                      subnivel: true
                    }
                  }
                }
              })
              : [],
            fIds.length > 0
              ? prisma.personagem_forma.findMany({
                where: { id: { in: fIds } },
                include: {
                  personagem: {
                    select: {
                      id: true,
                      nome: true,
                      imagemRosto: true
                    }
                  },
                  sistema: {
                    select: {
                      id: true,
                      nome: true
                    }
                  }
                }
              })
              : [],
            lIds.length > 0
              ? prisma.locais.findMany({
                where: { id: { in: lIds } },
                select: {
                  id: true,
                  nome: true,
                  mundo: true,
                  descricao: true,
                  imagem: true
                }
              })
              : [],
            iIds.length > 0
              ? prisma.itens.findMany({
                where: { id_item: { in: iIds } },
                select: {
                  id_item: true,
                  nome: true,
                  tipo: true,
                  descricao: true,
                  aparencia: true,
                  listaHabilidades: true,
                  urlImagem: true
                }
              })
              : [],
            cIds.length > 0
              ? prisma.bestiario.findMany({
                where: { id: { in: cIds } },
                select: {
                  id: true,
                  nome: true,
                  tipo: true,
                  descricao: true,
                  mundo: true,
                  ranque: true,
                  subnivel: true,
                  classificacao: true,
                  nivelMedio: true,
                  ponto_combate: true,
                  ponto_combateAetheris: true,
                  imagemBestiario: true
                }
              })
              : []
          ]);

          return {
            ...capitulo,
            personagens_detalhes: personagens,
            formas_detalhes: formas,
            locais_detalhes: locais,
            itens_detalhes: itens,
            criaturas_detalhes: criaturas
          };
        })
      );

      return res.json(toJSON({
        data: capitulosComDetalhes,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }));
    } catch (error) {
      return handleError(res, error);
    }
  },
  // PATCH /capitulos/:id/limpar-conteudo
  async destroyConteudo(req, res) {
    try {
      const { id } = req.params;
      let idFinal = !isNaN(Number(id)) ? Number(id) : null;

      if (!idFinal) {
        const capituloCorrespondente = await prisma.capitulos.findFirst({
          where: { titulo: id }
        });
        if (!capituloCorrespondente) {
          return res.status(404).json({ error: "Capítulo não encontrado para limpar o conteúdo." });
        }
        idFinal = capituloCorrespondente.id;
      }

      const atualizado = await prisma.capitulos.update({
        where: { id: idFinal },
        data: {
          conteudo_json: null,
          personagens_participantes: null,
          formas_participantes: null,
          itens_participantes: null,
          locais_participantes: null,
          criaturas_participantes: null // <-- NOVO: Limpar também as criaturas
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