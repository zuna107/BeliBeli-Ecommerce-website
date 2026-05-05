import { redirect } from '@sveltejs/kit'
import type { RequestHandler } from './$types'

// GET /logout — clear access_token cookie and redirect to login
export const GET: RequestHandler = ({ cookies }) => {
  cookies.delete('access_token', { path: '/' })
  throw redirect(302, '/login')
}
