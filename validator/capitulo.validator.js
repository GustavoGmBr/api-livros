import { z } from 'zod';

export const capituloSchema = z.object({
  livro_id: z.number().int(),
  parent_id: z.number().int().nullable().optional(),
  numero: z.number().int(),
  titulo: z.string().min(1),
  personagens_participantes: z.any().optional(),
  formas_participantes: z.any().optional(),
  itens_participantes: z.any().optional(),
  locais_participantes: z.any().optional(),
  conteudo_json: z.any().optional(),
});

export default capituloSchema;