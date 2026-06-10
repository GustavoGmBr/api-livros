import { z } from 'zod';

export const personagemFormaSchema = z.object({
  personagem_id: z.number().int(),
  sistema_id: z.number().int(),
  historico_id: z.number().int().nullable().optional(),
  nome: z.string().min(1).max(255),
  descricao: z.string().nullable().optional(),
  ranque: z.string().nullable().optional(),
  subnivel: z.number().int().default(1),
  bonusPC: z.number().default(0),
  pcForma: z.number().int().nullable().optional(), // ➕ Validação do novo campo
  imagemRosto: z.string().nullable().optional(),
  imagemCorpo: z.string().nullable().optional(),
  livrosId: z.number().int().nullable().optional(),
  capitulosId: z.number().int().nullable().optional(),
});

export default personagemFormaSchema;