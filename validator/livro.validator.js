import { z } from 'zod';

export const livroSchema = z.object({
  titulo: z.string().min(1).max(255),
  sinopse: z.string().nullable().optional(),
  data_publicacao: z.coerce.date().nullable().optional(),
  ordem_serie: z.number().int().nullable().optional(),
  saga_id: z.number().int().nullable().optional(),
  foto_capa: z.string().nullable().optional(), // Adicionado campo para a URL da capa
});

// Schema para validação dos dados do formulário (sem arquivo)
export const livroFormSchema = z.object({
  titulo: z.string().min(1).max(255),
  sinopse: z.string().nullable().optional(),
  data_publicacao: z.coerce.date().nullable().optional(),
  ordem_serie: z.coerce.number().int().nullable().optional(),
  saga_id: z.coerce.number().int().nullable().optional(),
});