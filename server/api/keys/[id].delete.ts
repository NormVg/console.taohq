import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { apiKeys } from '../../db/schema'
import { getCookie, createError, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const authCookie = getCookie(event, 'console_authenticated')
  if (authCookie !== 'true' && authCookie !== '"true"') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID parameter is required'
    })
  }

  const db = useDb()
  await db
    .update(apiKeys)
    .set({ revoked: true })
    .where(eq(apiKeys.id, id))

  return { success: true }
})
