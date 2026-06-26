import { eq } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { folders } from '../../db/schema'
import { requireConsoleAccess } from '../../utils/cdnAuth'

export default defineEventHandler(async (event) => {
  await requireConsoleAccess(event)
  const id = getRouterParam(event, 'id')
  if (!id) return

  const db = useDb()
  
  try {
    await db.delete(folders).where(eq(folders.id, id))
    return { success: true }
  } catch (err: any) {
    setResponseStatus(event, 400)
    return { error: 'Cannot delete folder. It may not be empty.' }
  }
})
