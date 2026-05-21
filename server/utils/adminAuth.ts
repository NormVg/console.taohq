import type { H3Event } from 'h3'

export function requireAdmin(event: H3Event) {
  const authCookie = getCookie(event, 'console_authenticated')
  if (authCookie !== 'true' && authCookie !== '"true"') {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
}
