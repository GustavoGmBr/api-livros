import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({log: ['query', 'info', 'warn', 'error']});

// Exportação nomeada (para quem usa { prisma })
export { prisma };

// Exportação padrão (para quem usa import prisma from ...)
export default prisma;

console.log('💎 Prisma Client instanciado (Singleton).');