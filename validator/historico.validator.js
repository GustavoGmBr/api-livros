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
  subnivel: z.coerce.number().int().default(1),
  nivel: z.coerce.number().int().default(1),
  xpAtual: z.coerce.number().int().default(0),
  xpProximo: z.coerce.number().int().default(100),
  qtd_treino: z.coerce.number().int().default(0),
  ponto_combate: z.coerce.number().int().default(0),
  ponto_combateAetheris: z.coerce.number().int().default(0),
  bonusPCErion: z.coerce.number().int().default(0),

  // 🔥 CORREÇÃO: Campos Json com validação específica para o formato correto
  elementos: z.any().optional().nullable(),
  equipamento: z.any().optional().nullable(),
  habilidades: z.any().optional().nullable(),
  
  // 🔥 CORREÇÃO: Validação específica para formas_desbloqueadas
  formas_desbloqueadas: z.preprocess(
    (val) => {
      // Se for string vazia, retorna null
      if (val === "" || val === null || val === undefined) return null;
      
      // Se já for um array/objeto, retorna como está
      if (typeof val === 'object') return val;
      
      // Se for string JSON, tenta fazer parse
      if (typeof val === 'string') {
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      }
      
      return null;
    },
    z.array(
      z.object({
        forma_id: z.number().or(z.coerce.number()),
        pcForma: z.number().or(z.coerce.number()).optional().default(0),
        ranque: z.string().optional().nullable(),
        bonusAetheris: z.number().or(z.coerce.number()).optional().default(0)
      })
    ).nullable().optional()
  ),

  // Como no banco é uma tabela relacionada (inventarios[]), deixamos opcional para o validador principal
  inventario: z.array(z.any()).optional().default([])
});

// 🔥 Schema para validação parcial (update)
export const historicoUpdateSchema = historicoSchema.partial();