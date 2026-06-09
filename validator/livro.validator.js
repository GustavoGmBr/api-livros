import { z } from 'zod';

export const livroSchema = z.object({
  titulo: z.string().min(1).max(255),
  sinopse: z.string().nullable().optional(),
  data_publicacao: z.coerce.date().nullable().optional(),
  ordem_serie: z.number().int().nullable().optional(),
  saga_id: z.number().int().nullable().optional(),
});