import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { content } from '../../db/schema'

export default defineEventHandler(async (event) => {
  // 1. Enforce API key authentication
  const isValid = await validateApiKey(event)
  if (!isValid) {
    setResponseStatus(event, 401)
    return {
      error: 'Unauthorized',
      message: 'Invalid or missing API key',
      statusCode: 401
    }
  }

  // 2. Validate input
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    setResponseStatus(event, 400)
    return {
      error: 'Bad Request',
      message: 'Missing slug parameter',
      statusCode: 400
    }
  }

  const bodyData = await readBody(event)
  if (!bodyData || typeof bodyData.body !== 'string') {
    setResponseStatus(event, 400)
    return {
      error: 'Bad Request',
      message: 'Missing or invalid "body" field in request payload',
      statusCode: 400
    }
  }

  // 3. Find and update the content
  const db = useDb()
  
  // First verify it exists
  const [existing] = await db
    .select({ id: content.id })
    .from(content)
    .where(eq(content.slug, slug))

  if (!existing) {
    setResponseStatus(event, 404)
    return {
      error: 'Not Found',
      message: `No content found for slug: "${slug}"`,
      statusCode: 404
    }
  }

  // Update it
  const [updated] = await db
    .update(content)
    .set({
      body: bodyData.body,
      updatedAt: new Date()
    })
    .where(eq(content.slug, slug))
    .returning()

  return {
    success: true,
    message: `Content for "${slug}" successfully updated`,
    data: updated
  }
})
