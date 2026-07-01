import { z } from 'zod';

export const bestiarioSchema = z.object({
  nome: z.string().min(1, { message: "O nome da criatura é obrigatório." }).max(255),
  tipo: z.string().min(1, { message: "O tipo (ex: criatura, besta, monstro) é obrigatório." }).max(100), 
  descricao: z.string().nullable().optional().transform(val => val === '' ? null : val),
  mundo: z.string().nullable().optional().transform(val => val === '' ? null : val),
  ranque: z.string().nullable().optional().transform(val => val === '' ? null : val),
  subnivel: z.number().int().default(1),
  classificacao: z.string().nullable().optional().transform(val => val === '' ? null : val),
  nivelMedio: z.number().int().default(1),
  ponto_combate: z.number().int().default(0),
  ponto_combateAetheris: z.number().int().default(0),
  imagemBestiario: z.string().nullable().optional().transform(val => val === '' ? null : val),
});

export default bestiarioSchema;