import fp from 'fastify-plugin'
import { FastifyInstance } from 'fastify'
import nodemailer, { Transporter } from 'nodemailer'

declare module 'fastify' {
  interface FastifyInstance {
    mailer: Transporter
  }
}

export default fp(
  async (app: FastifyInstance) => {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST ?? 'localhost',
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: false,
      ...(process.env.SMTP_USER && {
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      }),
    })

    app.decorate('mailer', transporter)

    app.addHook('onClose', async () => {
      transporter.close()
    })
  },
  { name: 'mailer' },
)
