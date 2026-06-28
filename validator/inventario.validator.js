import { z } from 'zod';

export const inventarioSchema = z.object({
  historico_id: z.number().int().positive("O ID do histórico é obrigatório"),
  nome: z.string().min(1, "O nome do item é obrigatório").max(255),
  descricao: z.string().nullable().optional(),
  tipo: z.string().max(100).nullable().optional(),
  subtipo: z.string().max(100).nullable().optional(),
  quantidade: z.number().int().nonnegative("A quantidade deve ser um número inteiro não negativo").default(0),
  itemId: z.number().int().positive().nullable().optional(),
});