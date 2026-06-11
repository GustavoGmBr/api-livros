import { z } from 'zod';

// Alterado de RacaSchema para racasSchema para bater com o import do controller
export const racasSchema = z.object({
  nome: z.string().max(80, 'O nome deve ter no máximo 80 caracteres'),
  base: z.number().int(),
  limite: z.number().int(),
  mundo: z.string().max(80, 'O mundo deve ter no máximo 80 caracteres').default('Geral'),
  sistema_id: z.number().int()
});

export default racasSchema;