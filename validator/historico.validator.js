import { z } from 'zod';

// 🔥 Schema do objeto que será salvo no JSON
const formaDesbloqueadaSchema = z.object({
  forma_id: z.union([
    z.number(),
    z.coerce.number()
  ]),
  pcForma: z.union([
    z.number(),
    z.coerce.number()
  ]).optional().default(0),
  ranque: z.string().optional().nullable().default(''),
  bonusAetheris: z.union([
    z.number(),
    z.coerce.number()
  ]).optional().default(0)
});

export const historicoSchema = z.object({
  personagem_id: z.union([
    z.number(),
    z.coerce.number({ invalid_type_error: "ID do personagem inválido" })
  ]),
  raca_id: z.union([
    z.number(),
    z.coerce.number({ invalid_type_error: "ID da raça inválido" })
  ]),

  // Aceita strings vazias vindas de selects do HTML e converte para null
  livro_id: z.preprocess(
    (val) => (val === "" || val === null ? null : val), 
    z.union([z.number(), z.coerce.number()]).nullable().optional()
  ),
  capitulo_id: z.preprocess(
    (val) => (val === "" || val === null ? null : val), 
    z.union([z.number(), z.coerce.number()]).nullable().optional()
  ),

  idade: z.string().nullable().optional(),
  titulo: z.string().nullable().optional(),
  ranque: z.string().nullable().optional(),
  classificacao: z.string().nullable().optional(),
  classes: z.string().nullable().optional(),
  estilo_luta: z.string().nullable().optional(),
  maestria: z.string().nullable().optional(),

  // Força a conversão para número
  subnivel: z.union([z.number(), z.coerce.number()]).default(1),
  nivel: z.union([z.number(), z.coerce.number()]).default(1),
  xpAtual: z.union([z.number(), z.coerce.number()]).default(0),
  xpProximo: z.union([z.number(), z.coerce.number()]).default(100),
  qtd_treino: z.union([z.number(), z.coerce.number()]).default(0),
  ponto_combate: z.union([z.number(), z.coerce.number()]).default(0),
  ponto_combateAetheris: z.union([z.number(), z.coerce.number()]).default(0),
  bonusPCErion: z.union([z.number(), z.coerce.number()]).default(0),

  // Campos Json - aceitam qualquer valor
  elementos: z.any().optional().nullable(),
  equipamento: z.any().optional().nullable(),
  habilidades: z.any().optional().nullable(),

  // 🔥 FORMAS DESBLOQUEADAS - Validação específica
  formas_desbloqueadas: z.preprocess(
    (val) => {
      // Se for string vazia, null ou undefined
      if (val === "" || val === null || val === undefined) {
        return null;
      }

      // Se for string JSON, tenta parse
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return parsed;
        } catch {
          return null;
        }
      }

      // Se já for um array, retorna como está
      if (Array.isArray(val)) {
        return val;
      }

      return null;
    },
    z.array(formaDesbloqueadaSchema).nullable().optional()
  ),

  // Inventário (opcional)
  inventario: z.array(z.any()).optional().default([])
});

// 🔥 Schema para validação parcial (update)
export const historicoUpdateSchema = historicoSchema.partial();