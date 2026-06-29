// server/validator/inventario.validator.js
import { z } from 'zod';

export const inventarioSchema = z.object({
  capitulo_id: z.number().int().positive("O ID do capítulo é obrigatório"), // 🔥 Mudança
  nome: z.string().min(1, "O nome do item é obrigatório").max(255),
  descricao: z.string().nullable().optional(),
  tipo: z.string().max(100).nullable().optional(),
  subtipo: z.string().max(100).nullable().optional(),
  quantidade: z.number().int().nonnegative("A quantidade deve ser um número inteiro não negativo").default(0),
  itemId: z.number().int().positive().nullable().optional(),
});

// Schema para criar moeda padrão
export const moedaPadraoSchema = z.object({
  capitulo_id: z.number().int().positive("O ID do capítulo é obrigatório"),
  nome: z.string().default('Aether'),
  tipo: z.string().default('Moeda'),
  quantidade: z.number().int().default(0),
  subtipo: z.string().default('Dinheiro'),
  descricao: z.string().default('Dinheiro usado na dimensão de Aetheris')
});