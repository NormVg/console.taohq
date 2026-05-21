import { desc } from 'drizzle-orm'
import { useDb } from '../../db/client'
import { content } from '../../db/schema'

// GET /api/cms — list all entries, newest first
export default defineEventHandler(async () => {
  const db = useDb()
  const rows = await db
    .select()
    .from(content)
    .orderBy(desc(content.createdAt))
  return rows
})
