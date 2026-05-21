import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { content } from '../../db/schema'

// GET /api/content/:slug — public endpoint, serves with correct Content-Type
export default defineEventHandler(async (event) => {
  // Enforce API key authentication
  const isValid = await validateApiKey(event)
  if (!isValid) {
    setResponseStatus(event, 401)
    return {
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
      statusCode: 401
    }
  }

  const slug = getRouterParam(event, 'slug')
  const db   = useDb()

  const [row] = await db
    .select()
    .from(content)
    .where(eq(content.slug, slug!))

  if (!row || !row.published) {
    setResponseStatus(event, 404)
    return {
      error: 'Not Found',
      message: `No published content found for slug: "${slug}"`,
      statusCode: 404
    }
  }

  switch (row.type) {
    case 'json':
      setResponseHeader(event, 'Content-Type', 'application/json; charset=utf-8')
      return row.body   // Nitro will stringify if it's already a string — just return raw

    case 'markdown':
      setResponseHeader(event, 'Content-Type', 'text/markdown; charset=utf-8')
      return row.body

    default: // 'text'
      setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
      return row.body
  }
})
