import { desc, eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { apiKeys } from '../../db/schema'
import { getCookie, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const authCookie = getCookie(event, 'console_authenticated')
  if (authCookie !== 'true' && authCookie !== '"true"') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const db = useDb()
  const rows = await db
    .select({
      id: apiKeys.id,
      name: apiKeys.name,
      prefix: apiKeys.prefix,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
      revoked: apiKeys.revoked,
    })
    .from(apiKeys)
    .where(eq(apiKeys.revoked, false))
    .orderBy(desc(apiKeys.createdAt))

  return rows
})
