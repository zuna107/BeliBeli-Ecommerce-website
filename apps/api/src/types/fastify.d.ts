import type { FastifyRequest } from 'fastify'

// Augment FastifyRequest dengan user dari JWT
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      sub: string     // user ID
      email: string
      role: 'buyer' | 'seller' | 'admin'
      iat?: number
      exp?: number
    }
    user: {
      sub: string
      email: string
      role: 'buyer' | 'seller' | 'admin'
    }
  }
}

// Re-export untuk kemudahan
export type AuthenticatedRequest = FastifyRequest & {
  user: {
    sub: string
    email: string
    role: 'buyer' | 'seller' | 'admin'
  }
}
