import { z } from 'zod';

export const localSchema = z.object({
  nome: z.string().min(1, "O nome é obrigatório").max(255),
  mundo: z.string().min(1, "O mundo de origem é obrigatório").max(255),
  descricao: z.string().nullable().optional(),
  imagem: z.string().url("A imagem deve ser uma URL válida").nullable().optional(),
});