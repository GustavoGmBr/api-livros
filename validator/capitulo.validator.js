import { z } from "zod";

export const capituloSchema = z.object({
  // Coerce garante que mesmo se vier String "5" do front-end, vire Number 5
  livro_id: z.coerce.number({ required_error: "O ID do livro é obrigatório" }),
  parent_id: z.coerce.number().nullable().optional(),
  numero: z.coerce.number({ required_error: "O número do capítulo é obrigatório" }),
  titulo: z.string({ required_error: "O título é obrigatório" }).min(1),
  
  // 🌟 CORREÇÃO: Mapeando os arrays participantes na raiz para o Zod não os deletar!
  personagens_participantes: z.array(z.coerce.number()).nullable().optional(),
  formas_participantes: z.array(z.coerce.number()).nullable().optional(),
  itens_participantes: z.array(z.coerce.number()).nullable().optional(),
  locais_participantes: z.array(z.coerce.number()).nullable().optional(),

  conteudo_json: z.array(
    z.object({
      tipo: z.enum(['narrativa', 'paragrafo', 'dialogo', 'pensamento', 'quebra_cena', 'citacao', 'quebra-cena']),
      ordem: z.number().int(),
      personagem_id: z.coerce.number().int().nullable().optional(),
      sexo: z.string().trim().nullable().optional(),
      personagens_participantes: z.array(z.coerce.number().int()).nullable().optional(),
      formas_participantes: z.array(z.coerce.number().int()).nullable().optional(),
      conteudo: z.object({
        texto: z.string().optional().nullable(),
        fala: z.string().optional().nullable(),
        personagem_nome: z.string().trim().nullable().optional(),
        tom: z.string().nullable().optional(),
        sentimento: z.string().nullable().optional(),
        acaoPosFala: z.string().nullable().optional(),
        personagem_id: z.union([z.number(), z.string()]).nullable().optional(),
        forma_id: z.coerce.number().nullable().optional()
      }).catchall(z.any())
    }).catchall(z.any())
  ).nullable().optional(), // Permitido ser nulo ou vazio inicialmente
  
  resumo: z.any().optional(),
  notas: z.any().optional()
});

export default capituloSchema;