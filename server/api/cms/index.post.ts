import { useDb } from '../../db/client'
import { content } from '../../db/schema'

// POST /api/cms — create a new entry
export default defineEventHandler(async (event) => {
  const body = await readBody(event)

  const { title, slug, type, body: entryBody, published } = body

  if (!title || !slug || !type) {
    throw createError({ statusCode: 400, message: 'title, slug, and type are required.' })
  }

  if (!['text', 'markdown', 'json'].includes(type)) {
    throw createError({ statusCode: 400, message: 'type must be text, markdown, or json.' })
  }

  // Validate JSON body if type is json
  if (type === 'json') {
    try { JSON.parse(entryBody || '{}') } catch {
      throw createError({ statusCode: 400, message: 'body must be valid JSON when type is json.' })
    }
  }

  const db = useDb()
  const [row] = await db
    .insert(content)
    .values({
      title,
      slug:      slug.toLowerCase().trim().replace(/\s+/g, '-'),
      type,
      body:      entryBody ?? '',
      published: published ?? true
    })
    .returning()

  return row
})
