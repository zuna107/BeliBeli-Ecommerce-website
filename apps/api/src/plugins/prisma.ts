import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import { PrismaClient } from '@beibeli/db'

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient
  }
}

export default fp(
  async (app: FastifyInstance) => {
    const prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    })

    await prisma.$connect()

    app.decorate('prisma', prisma)

    app.addHook('onClose', async () => {
      await prisma.$disconnect()
    })
  },
  { name: 'prisma' },
)
