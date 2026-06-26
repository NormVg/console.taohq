import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { content } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) return

  const body = await readBody(event)
  const db = useDb()
  
  const updates: any = { updatedAt: new Date() }
  if (body.folderId !== undefined) updates.folderId = body.folderId
  if (body.title !== undefined) updates.title = body.title
  if (body.slug !== undefined) updates.slug = body.slug

  const [row] = await db.update(content).set(updates).where(eq(content.id, id)).returning()
  return row
})
