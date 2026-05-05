import type { Handle } from '@sveltejs/kit'
import { PUBLIC_API_URL } from '$env/static/public'

export const handle: Handle = async ({ event, resolve }) => {
  const accessToken = event.cookies.get('access_token')

  if (accessToken) {
    try {
      const res = await fetch(`${PUBLIC_API_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        const data = await res.json()
        event.locals.user = { sub: data.id, email: data.email, role: data.role }
      } else {
        event.locals.user = null
      }
    } catch {
      event.locals.user = null
    }
  } else {
    event.locals.user = null
  }

  return resolve(event)
}
