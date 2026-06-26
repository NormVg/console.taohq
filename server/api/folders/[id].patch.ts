import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { folders } from '../../db/schema'
import { requireConsoleAccess } from '../../utils/cdnAuth'

export default defineEventHandler(async (event) => {
  await requireConsoleAccess(event)
  const id = getRouterParam(event, 'id')
  if (!id) return

  const body = await readBody(event)
  const db = useDb()
  
  const updates: any = { updatedAt: new Date() }
  if (body.name !== undefined) updates.name = body.name
  if (body.parentId !== undefined) updates.parentId = body.parentId

  const [folder] = await db.update(folders).set(updates).where(eq(folders.id, id)).returning()
  return folder
})
