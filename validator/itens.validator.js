import { z } from 'zod';

export const itemSchema = z.object({
  nome: z.string().min(1, "O nome do item é obrigatório").max(100),
  tipo: z.string().min(1, "O tipo do item é obrigatório").max(80),
  descricao: z.string().nullable().optional(),
  aparencia: z.string().nullable().optional(),
  listaHabilidades: z.union([z.array(z.any()), z.record(z.any())]).default([]),
  urlImagem: z.string().url("A imagem deve ser uma URL válida").nullable().optional(),
  usuarios: z.union([z.array(z.any()), z.record(z.any())]).nullable().optional(),
});