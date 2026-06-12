import { z } from 'zod';

export const personagemFormaSchema = z.object({
  personagem_id: z.coerce
    .number({ required_error: "ID do personagem é obrigatório" })
    .int("ID do personagem precisa ser um número inteiro"),
    
  sistema_id: z.coerce
    .number({ required_error: "ID do sistema é obrigatório" })
    .int("ID do sistema precisa ser um número inteiro"),
    
  nome: z.string({ required_error: "O nome é obrigatório" })
    .trim()
    .min(1, "O nome não pode estar vazio")
    .max(255, "O nome deve ter no máximo 255 caracteres"),
    
  // Se o usuário mandar uma string vazia "", o .transform() converte para null
  descricao: z.string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
    
  ranque: z.string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val === '' ? null : val)),
    
  subnivel: z.coerce
    .number()
    .int("O subnível precisa ser um número inteiro")
    .default(1),
    
  bonusPC: z.coerce
    .number()
    .default(0),
    
  pcForma: z.coerce
    .number()
    .int("O PC da forma precisa ser um número inteiro")
    .optional()
    .nullable()
    .transform((val) => (val === '' || isNaN(val) ? null : val)),
  
  // Transforma as strings vazias do formulário de imagem em null para o Prisma
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

export default personagemFormaSchema;