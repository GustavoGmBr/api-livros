import { z } from "zod";

export const capituloSchema = z.object({
  livro_id: z.number(),
  parent_id: z.number().nullable().optional(),
  numero: z.number(),
  titulo: z.string(),
  conteudo_json: z.array(
    z.object({
      tipo: z.enum(['narrativa', 'paragrafo', 'dialogo', 'pensamento', 'quebra_cena', 'citacao', 'quebra-cena']),
      ordem: z.number().int(),
      personagem_id: z.number().int().nullable().optional(),
      sexo: z.string().trim().nullable().optional(),
      personagens_participantes: z.array(z.number().int()).nullable().optional(),
      formas_participantes: z.array(z.number().int()).nullable().optional(),
      conteudo: z.object({
        texto: z.string().optional().nullable(),
        fala: z.string().optional().nullable(),
        personagem_nome: z.string().trim().nullable().optional(),
        tom: z.string().nullable().optional(),
        sentimento: z.string().nullable().optional(),
        acaoPosFala: z.string().nullable().optional(),
        personagem_id: z.union([z.number(), z.string()]).nullable().optional(),
        forma_id: z.number().nullable().optional()
      }).catchall(z.any())
    }).catchall(z.any())
  ),
  resumo: z.any().optional(),
  notas: z.any().optional()
});

export default capituloSchema;