import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { content } from '../../db/schema'

// DELETE /api/cms/:id
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  const db  = useDb()

  const [row] = await db
    .delete(content)
    .where(eq(content.id, id!))
    .returning()

  if (!row) throw createError({ statusCode: 404, message: 'Entry not found.' })
  return { success: true, id: row.id }
})
