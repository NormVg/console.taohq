import { eq } from 'drizzle-orm'
import { useDb } from '../../../db/client'
import { cdnAssets } from '../../../db/schema'
import { requireConsoleAccess } from '../../../utils/cdnAuth'
import { deleteFromBucket0, sanitizeAssetPath } from '../../../utils/bucket0'

export default defineEventHandler(async (event) => {
  await requireConsoleAccess(event)

  const rawKey = getRouterParam(event, 'key')
  const key = sanitizeAssetPath(Array.isArray(rawKey) ? rawKey.join('/') : rawKey || '')

  const db = useDb()
  const [asset] = await db
    .select()
    .from(cdnAssets)
    .where(eq(cdnAssets.key, key))

  if (!asset) {
    throw createError({ statusCode: 404, statusMessage: 'Asset not found' })
  }

  await deleteFromBucket0(asset.bucketKey)
  await db.delete(cdnAssets).where(eq(cdnAssets.key, key))

  return { success: true, key }
})
