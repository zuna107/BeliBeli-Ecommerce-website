import { buildApp } from './app.js'

const PORT = parseInt(process.env.PORT ?? '3000')
const HOST = process.env.HOST ?? '0.0.0.0'

async function start() {
  const app = await buildApp()

  try {
    await app.listen({ port: PORT, host: HOST })
    app.log.info(`BeliBeli API listening at http://localhost:${PORT}`)
    if (process.env.NODE_ENV !== 'production') {
      app.log.info(`Swagger docs available at http://localhost:${PORT}/docs`)
    }
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
