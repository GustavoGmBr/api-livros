import { z } from 'zod';

export const historicoSchema = z.object({
  personagem_id: z.coerce.number({ invalid_type_error: "ID do personagem inválido" }),
  raca_id: z.coerce.number({ invalid_type_error: "ID da raça inválido" }),

  // Aceita strings vazias vindas de selects do HTML e converte para null (idêntico ao banco)
  livro_id: z.preprocess((val) => (val === "" || val === null ? null : val), z.coerce.number().nullable().optional()),
  capitulo_id: z.preprocess((val) => (val === "" || val === null ? null : val), z.coerce.number().nullable().optional()),

  idade: z.string().nullable().optional(),
  titulo: z.string().nullable().optional(),
  ranque: z.string().nullable().optional(),
  classificacao: z.string().nullable().optional(),
  classes: z.string().nullable().optional(),
  estilo_luta: z.string().nullable().optional(),
  maestria: z.string().nullable().optional(),

  // Força a conversão para número e aceita o padrão vindo do seu formulário
  subnivel: z.coerce.number().int().default(1), // No Prisma o padrão é 1
  nivel: z.coerce.number().int().default(1),    // No Prisma o padrão é 1
  xpAtual: z.coerce.number().int().default(0),
  xpProximo: z.coerce.number().int().default(100),
  qtd_treino: z.coerce.number().int().default(0),
  ponto_combate: z.coerce.number().int().default(0),
  ponto_combateAetheris: z.coerce.number().int().default(0),
  bonusPCErion: z.coerce.number().int().default(0),

  // Campos definidos como Json? no seu schema do banco
  elementos: z.any().optional().nullable(),
  equipamento: z.any().optional().nullable(),
  habilidades: z.any().optional().nullable(),

  // No seu arquivo historico.validator.js, atualize o campo formas_desbloqueadas:
  formas_desbloqueadas: z.array(
    z.object({
      forma_id: z.coerce.number({ invalid_type_error: "ID da forma inválido" }),
      subnivel: z.coerce.number().int().default(1), // 🔥 Adicionado aqui
      pcForma: z.coerce.number({ invalid_type_error: "PC da forma inválido" }),
      ranque: z.string({ invalid_type_error: "Ranque deve ser uma string" }),
      bonusAetheris: z.coerce.number({ invalid_type_error: "Bônus Aetheris inválido" })
    })
  ).optional().nullable(),

  // Como no banco é uma tabela relacionada (inventarios[]), deixamos opcional para o validador principal
  inventario: z.array(z.any()).optional().default([])
});