// validator/bestiario.validator.js

import { z } from 'zod';

export const bestiarioSchema = z.object({
  nome: z.string().min(1, { message: "O nome da criatura é obrigatório." }).max(255),
  tipo: z.string().min(1, { message: "O tipo (ex: criatura, besta, monstro) é obrigatório." }).max(100),
  descricao: z.string().nullable().optional().transform(val => val === '' ? null : val),
  mundo: z.string().nullable().optional().transform(val => val === '' ? null : val),
  ranque: z.string().nullable().optional().transform(val => val === '' ? null : val),
  subnivel: z.union([
    z.number().int().min(1).max(5),
    z.string().transform(val => {
      const num = Number(val);
      if (isNaN(num) || num < 1 || num > 5) return 1;
      return Math.floor(num);
    })
  ]).default(1),
  classificacao: z.string().nullable().optional().transform(val => val === '' ? null : val),
  nivelMedio: z.union([
    z.number().int().min(1),
    z.string().transform(val => {
      const num = Number(val);
      return isNaN(num) || num < 1 ? 1 : Math.floor(num);
    })
  ]).default(1),
  ponto_combate: z.union([
    z.number().int().min(0),
    z.string().transform(val => {
      const num = Number(val);
      return isNaN(num) || num < 0 ? 0 : Math.floor(num);
    })
  ]).default(0),
  ponto_combateAetheris: z.union([
    z.number().int().min(0),
    z.string().transform(val => {
      const num = Number(val);
      return isNaN(num) || num < 0 ? 0 : Math.floor(num);
    })
  ]).default(0),
  imagemBestiario: z.string().nullable().optional().transform(val => val === '' ? null : val),
});

export default bestiarioSchema;