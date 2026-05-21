import type { H3Event } from 'h3'
import { getCookie } from 'h3'
import { validateApiKey } from './apiKey'

export async function hasConsoleAccess(event: H3Event): Promise<boolean> {
  const authCookie = getCookie(event, 'console_authenticated')
  if (authCookie === 'true' || authCookie === '"true"') {
    return true
  }

  return validateApiKey(event)
}

export async function requireConsoleAccess(event: H3Event) {
  if (!(await hasConsoleAccess(event))) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }
}
