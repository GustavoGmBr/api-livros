import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  const login = 'nicolas'
  const novaSenha = 'nico12356'

  const hash = await bcrypt.hash(novaSenha, 10)

  // O upsert garante que se não existir, ele cria!
  const usuario = await prisma.usuarios.upsert({
    where: { login },
    update: { 
      senha: hash 
    },
    create: {
      login,
      senha: hash,
      nivel_acesso: 1 // Garante o nível de acesso 1 para ser ADM
    }
  })

  console.log(`✅ Sucesso! O usuário "${usuario.login}" foi criado ou teve sua senha atualizada com hash.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())