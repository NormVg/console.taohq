import { desc, eq, isNull } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { content } from '../../db/schema'

// GET /api/cms — list all entries, newest first
export default defineEventHandler(async (event) => {
  const db = useDb()
  const query = getQuery(event)
  const folderId = query.folderId as string | undefined

  let q = db.select().from(content)

  if (folderId === 'null') {
    q = q.where(isNull(content.folderId)) as any
  } else if (folderId) {
    q = q.where(eq(content.folderId, folderId)) as any
  }

  const rows = await q.orderBy(desc(content.createdAt))
  return rows
})
