import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { content } from '../../db/schema'

// PUT /api/cms/:id
export default defineEventHandler(async (event) => {
  const id   = getRouterParam(event, 'id')
  const body = await readBody(event)

  const { title, slug, type, body: entryBody, published, folderId } = body

  if (!title || !slug || !type) {
    throw createError({ statusCode: 400, message: 'title, slug, and type are required.' })
  }

  if (!['text', 'markdown', 'json'].includes(type)) {
    throw createError({ statusCode: 400, message: 'type must be text, markdown, or json.' })
  }

  if (type === 'json') {
    try { JSON.parse(entryBody || '{}') } catch {
      throw createError({ statusCode: 400, message: 'body must be valid JSON when type is json.' })
    }
  }

  const db = useDb()
  const [row] = await db
    .update(content)
    .set({
      title,
      slug:      slug.toLowerCase().trim().replace(/\s+/g, '-'),
      type,
      body:      entryBody ?? '',
      published: published ?? true,
      folderId:  folderId ?? null,
      updatedAt: new Date()
    })
    .where(eq(content.id, id!))
    .returning()

  if (!row) throw createError({ statusCode: 404, message: 'Entry not found.' })
  return row
})
