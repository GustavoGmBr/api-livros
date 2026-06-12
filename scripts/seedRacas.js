import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando o seed do banco de dados...');

  // ==========================================
  // 1. CADASTRO DOS SISTEMAS (IDs FIXOS)
  // ==========================================
  
  // Sistema Erion (ID: 1)
  const sistemaErion = await prisma.sistemas.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nome: 'Padrão',
      progressao: [
        { "ordem": 1, "raridade": "Inferior", "valores": [1, 10] },
        { "ordem": 2, "raridade": "Comum", "valores": [10, 25] },
        { "ordem": 3, "raridade": "Incomum", "valores": [25, 50] },
        { "ordem": 4, "raridade": "Avançado", "valores": [50, 100] },
        { "ordem": 5, "raridade": "Superior", "valores": [100, 200] },
        { "ordem": 6, "raridade": "Lendário", "valores": [200, 400] },
        { "ordem": 7, "raridade": "Divino", "valores": [400, 700] },
        { "ordem": 8, "raridade": "Místico", "valores": [700, 1650] },
        { "ordem": 9, "raridade": "Celestial", "valores": [700, 1300] },
        { "ordem": 10, "raridade": "Transcendente", "valores": [1300, 1700] },
        { "ordem": 11, "raridade": "Guardião", "valores": [1700, 1900] },
        { "ordem": 12, "raridade": "Criador", "valores": [1900, 3000] }
      ],
      limite_bonus: { 
        "Inferior": 50, "Comum": 50, "Incomum": 80, "Avançado": 100, "Superior": 150, 
        "Lendário": 200, "Divino": 300, "Celestial": 500, "Transcendente": 1000, 
        "Guardião": 9999, "Criador": 9999 
      }
    }
  });

  // Sistema de Demônios (ID: 2)
  const sistemaDemonios = await prisma.sistemas.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      nome: 'Demônios',
      progressao: [
        { "ordem": 1, "raridade": "Inferior", "valores": [40, 90] },
        { "ordem": 2, "raridade": "Bestial", "valores": [90, 180] },
        { "ordem": 3, "raridade": "Combatente", "valores": [180, 350] },
        { "ordem": 4, "raridade": "Oculta", "valores": [350, 600] },
        { "ordem": 5, "raridade": "Superior", "valores": [600, 1100] },
        { "ordem": 6, "raridade": "Desastre", "valores": [1100, 1600] },
        { "ordem": 7, "raridade": "Primordial", "valores": [1800, 2800] }
      ],
      limite_bonus: { 
        "Inferior": 80, "Bestial": 120, "Combatente": 180, 
        "Oculta": 250, "Superior": 400, "Desastre": 750, "Primordial": 2000 
      }
    }
  });

  console.log('✅ Sistemas cadastrados ou atualizados!');

  // ==========================================
  // 2. CADASTRO DAS RAÇAS
  // ==========================================
  const dadosRacas = [
    { nome: 'Demônios',   base: 15, limite: 5,  sistema_id: 2 }, // Sistema Demônios
    { nome: 'Dragões',    base: 20, limite: 5,  sistema_id: 1 }, // Sistema Erion
    { nome: 'Fadas',      base: 16, limite: 4,  sistema_id: 1 },
    { nome: 'Vampiros',   base: 12, limite: 8,  sistema_id: 1 },
    { nome: 'Lobisomens', base: 12, limite: 8,  sistema_id: 1 },
    { nome: 'Elfos',      base: 9,  limite: 11, sistema_id: 1 },
    { nome: 'Anões',      base: 9,  limite: 11, sistema_id: 1 },
    { nome: 'Gigantes',   base: 8,  limite: 12, sistema_id: 1 },
    { nome: 'Marines',    base: 5,  limite: 15, sistema_id: 1 },
    { nome: 'Ferais',     base: 5,  limite: 15, sistema_id: 1 },
    { nome: 'Humanos',    base: 1,  limite: 19, sistema_id: 1 }
  ];

  console.log('⏳ Inserindo raças...');

  // Como o model 'racas' não possui um campo @unique em 'nome', faremos a busca manual
  // para decidir se cria ou pula/atualiza, evitando duplicar dados ao rodar o seed novamente.
  for (const raca of dadosRacas) {
    const racaExistente = await prisma.racas.findFirst({
      where: { nome: raca.nome }
    });

    if (racaExistente) {
      // Se já existe, atualiza os valores
      await prisma.racas.update({
        where: { id: racaExistente.id },
        data: {
          base: raca.base,
          limite: raca.limite,
          sistema_id: raca.sistema_id
        }
      });
    } else {
      // Se não existe, cria do zero
      await prisma.racas.create({
        data: {
          nome: raca.nome,
          base: raca.base,
          limite: raca.limite,
          sistema_id: raca.sistema_id,
          mundo: 'Geral' // Valor default do seu schema
        }
      });
    }
  }

  console.log('✅ Todas as raças foram cadastradas com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });