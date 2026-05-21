import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { content } from '../../db/schema'

// GET /api/cms/:id
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db  = useDb()

  const [row] = await db.select().from(content).where(eq(content.id, id!))
  if (!row) throw createError({ statusCode: 404, message: 'Entry not found.' })

  return row
})
