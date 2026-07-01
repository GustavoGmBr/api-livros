// validator/bestiario.validator.js

import { z } from 'zod';

export const bestiarioSchema = z.object({
  nome: z.string().min(1, { message: "O nome da criatura é obrigatório." }).max(255),
  tipo: z.string().min(1, { message: "O tipo (ex: criatura, besta, monstro) é obrigatório." }).max(100), 
  descricao: z.string().nullable().optional().transform(val => val === '' ? null : val),
  mundo: z.string().nullable().optional().transform(val => val === '' ? null : val),
  ranque: z.string().nullable().optional().transform(val => val === '' ? null : val),
  subnivel: z.number().int().min(1).max(5).default(1), // 🔥 Adicionado validação de min/max
  classificacao: z.string().nullable().optional().transform(val => val === '' ? null : val), // 🔥 Agora aceita qualquer string
  nivelMedio: z.number().int().min(1).default(1), // 🔥 Adicionado validação de min
  ponto_combate: z.number().int().min(0).default(0), // 🔥 Adicionado validação de min
  ponto_combateAetheris: z.number().int().min(0).default(0), // 🔥 Adicionado validação de min
  imagemBestiario: z.string().nullable().optional().transform(val => val === '' ? null : val),
  sistema_id: z.number().int().nullable().optional().transform(val => val === '' ? null : val), // 🔥 Adicionado campo sistema_id
});

export default bestiarioSchema;