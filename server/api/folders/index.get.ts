import { eq, and, isNull } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { folders } from '../../db/schema'
import { requireConsoleAccess } from '../../utils/cdnAuth'

export default defineEventHandler(async (event) => {
  await requireConsoleAccess(event)
  const query = getQuery(event)
  const type = query.type as string
  const parentId = query.parentId as string

  if (!type) {
    setResponseStatus(event, 400)
    return { error: 'type is required' }
  }

  const db = useDb()
  const conditions = [eq(folders.type, type)]
  
  if (parentId && parentId !== 'null') {
    conditions.push(eq(folders.parentId, parentId))
  } else {
    conditions.push(isNull(folders.parentId))
  }

  const result = await db.select().from(folders).where(and(...conditions)).orderBy(folders.name)
  return result
})
