import { z } from 'zod';

export const personagemSchema = z.object({
  nome: z.string().min(1, { message: "O nome é obrigatório." }),
  titulo: z.string().nullable().optional().transform(val => val === '' ? null : val),
  mundo_origem: z.string().nullable().optional().transform(val => val === '' ? null : val), // Novo Campo
  classe: z.string().nullable().optional().transform(val => val === '' ? null : val),
  afiliacao: z.string().nullable().optional().transform(val => val === '' ? null : val),
  altura: z.string().nullable().optional().transform(val => val === '' ? null : val),
  peso: z.string().nullable().optional().transform(val => val === '' ? null : val),
  tipo_corporal: z.string().nullable().optional().transform(val => val === '' ? null : val),
  tipo_cabelo: z.string().nullable().optional().transform(val => val === '' ? null : val),
  cor_cabelo: z.string().nullable().optional().transform(val => val === '' ? null : val),
  olhos: z.string().nullable().optional().transform(val => val === '' ? null : val),
  olhos_especiais: z.string().nullable().optional().transform(val => val === '' ? null : val),
  tom_voz: z.string().nullable().optional().transform(val => val === '' ? null : val),
  traje_combate: z.string().nullable().optional().transform(val => val === '' ? null : val),
  traje_casual: z.string().nullable().optional().transform(val => val === '' ? null : val),
  armamento_principal: z.string().nullable().optional().transform(val => val === '' ? null : val),
  virtude: z.string().nullable().optional().transform(val => val === '' ? null : val),
  defeito: z.string().nullable().optional().transform(val => val === '' ? null : val),
  temperamento: z.string().nullable().optional().transform(val => val === '' ? null : val),
});

export default personagemSchema;