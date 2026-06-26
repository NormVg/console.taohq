import { eq } from 'drizzle-orm'
import { useDb } from '../../../db/client'
import { cdnAssets } from '../../../db/schema'
import { requireConsoleAccess } from '../../../utils/cdnAuth'

export default defineEventHandler(async (event) => {
  await requireConsoleAccess(event)
  const rawKey = getRouterParam(event, 'key')
  const keyParam = Array.isArray(rawKey) ? rawKey.join('/') : rawKey || ''
  if (!keyParam) return

  const body = await readBody(event)
  const db = useDb()

  const updates: any = { updatedAt: new Date() }
  if (body.folderId !== undefined) updates.folderId = body.folderId
  if (body.fileName !== undefined) updates.fileName = body.fileName
  if (body.access !== undefined) updates.access = body.access

  const [asset] = await db.update(cdnAssets).set(updates).where(eq(cdnAssets.key, keyParam)).returning()
  return asset
})
