import { z } from 'zod';

export const personagemFormaSchema = z.object({
  personagem_id: z.coerce
    .number({ required_error: "ID do personagem é obrigatório" })
    .int("ID do personagem precisa ser um número inteiro"),
    
  nome: z.string({ required_error: "O nome é obrigatório" })
    .trim()
    .min(1, "O nome não pode estar vazio")
    .max(255, "O nome deve ter no máximo 255 caracteres"),
    
  descricao: z.string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
    
  imagemRosto: z.string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
    
  imagemCorpo: z.string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
});

// Schema para criação (sem campos gerados automaticamente)
export const personagemFormaCreateSchema = personagemFormaSchema.omit({
  // Se houver campos que são gerados automaticamente, adicione aqui
});

// Schema para atualização (todos os campos opcionais)
export const personagemFormaUpdateSchema = personagemFormaSchema.partial();

export default personagemFormaSchema;