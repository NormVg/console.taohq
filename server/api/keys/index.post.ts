import { useDb } from '../../db/client'
import { apiKeys } from '../../db/schema'
import { generateKey } from '../../utils/apiKey'
import { getCookie, readBody, createError } from 'h3'

export default defineEventHandler(async (event) => {
  const authCookie = getCookie(event, 'console_authenticated')
  if (authCookie !== 'true' && authCookie !== '"true"') {
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  if (!body || !body.name || typeof body.name !== 'string') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Name is required'
    })
  }

  const db = useDb()
  const { full, prefix, hash } = generateKey()

  await db.insert(apiKeys).values({
    name: body.name.trim(),
    prefix,
    hash,
    revoked: false
  })

  // Return the full key ONLY once on creation
  return {
    fullKey: full,
    prefix,
    name: body.name.trim()
  }
})
