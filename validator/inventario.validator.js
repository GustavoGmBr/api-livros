// server/validator/inventario.validator.js
import { z } from 'zod';

export const inventarioSchema = z.object({
  capitulo_id: z.number({ required_error: "O ID do capítulo é obrigatório" }).int().positive(),
  nome: z.string().min(1, "O nome do item é obrigatório").max(255),
  descricao: z.string().max(65535, "A descrição está muito longa").nullable().optional(),
  tipo: z.string().max(100).nullable().optional().default(''),
  subtipo: z.string().max(100).nullable().optional().default(''),
  grau: z.string().max(100).nullable().optional(), // Presente no banco Prisma
  
  // Coerce garante que mesmo se vier como string numérica do front-end, o Zod converta para número antes de validar
  quantidade: z.coerce.number().nonnegative("A quantidade não pode ser negativa").default(0),
  
  // Corrigido de itemId para bater com o data.itensId_item do seu controller/prisma
  itensId_item: z.number().int().positive().nullable().optional(),
});

// Schema para criar moeda padrão
export const moedaPadraoSchema = z.object({
  capitulo_id: z.number({ required_error: "O ID do capítulo é obrigatório" }).int().positive(),
  nome: z.string().max(255).optional().default('Aether'),
  tipo: z.string().max(100).optional().default('Moeda'),
  quantidade: z.coerce.number().nonnegative().optional().default(0),
  subtipo: z.string().max(100).optional().default('Dinheiro'),
  descricao: z.string().max(65535).optional().default('Dinheiro usado na dimensão de Aetheris')
});