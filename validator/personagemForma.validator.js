import { z } from 'zod';

export const personagemFormaSchema = z.object({
  // 🆔 Chaves Estruturais de Identidade (Forçadas para Inteiros)
  personagem_id: z.coerce
    .number()
    .int("ID do personagem precisa ser um número inteiro"),
    
  sistema_id: z.coerce
    .number()
    .int("ID do sistema precisa ser um número inteiro"),

  // 📝 Atributos Textuais
  nome: z.string()
    .min(1, "O nome é obrigatório")
    .max(255, "Nome muito longo"),
    
  descricao: z.string()
    .nullable()
    .optional()
    .or(z.literal('')), // Tolera strings vazias vindas do formulário
    
  ranque: z.string()
    .nullable()
    .optional()
    .or(z.literal('')),

  // 📊 Atributos de Poder e Modulação
  subnivel: z.coerce
    .number()
    .int("O subnível precisa ser um número inteiro")
    .default(1),
    
  // 🚀 CORREÇÃO CRÍTICA: Mapeado como número decimal (Float) para bater com o Prisma
  bonusPC: z.coerce
    .number("O bônus de PC precisa ser um valor numérico")
    .default(0),
    
  pcForma: z.coerce
    .number()
    .int("O PC da forma precisa ser um número inteiro")
    .nullable()
    .optional(),

  // 🖼️ Caminhos de Uploads (Processados pós-FTP no controller)
  imagemRosto: z.string().nullable().optional().or(z.literal('')),
  imagemCorpo: z.string().nullable().optional().or(z.literal('')),

  // 🔗 IDs de Vinculação Opcionais (Identificados no seu Model do Prisma)
  livrosId: z.coerce
    .number()
    .int()
    .nullable()
    .optional(),
    
  capitulosId: z.coerce
    .number()
    .int()
    .nullable()
    .optional(),
    
  personagem_historicoId: z.coerce
    .number()
    .int()
    .nullable()
    .optional(),
});

export default personagemFormaSchema;