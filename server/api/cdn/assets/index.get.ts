import { desc, eq, isNull } from 'drizzle-orm'
import { useDb } from '../../../db/client'
import { cdnAssets } from '../../../db/schema'
import { requireConsoleAccess } from '../../../utils/cdnAuth'

export default defineEventHandler(async (event) => {
  await requireConsoleAccess(event)

  const db = useDb()
  const query = getQuery(event)
  const folderId = query.folderId as string | undefined

  let q = db.select().from(cdnAssets)
  
  if (folderId === 'null') {
    q = q.where(isNull(cdnAssets.folderId)) as any
  } else if (folderId) {
    q = q.where(eq(cdnAssets.folderId, folderId)) as any
  }

  const rows = await q.orderBy(desc(cdnAssets.createdAt))

  return rows.map((asset) => {
    const { cacheData: _cacheData, ...safeAsset } = asset
    return {
      ...safeAsset,
      publicUrl: `/api/cdn/assets/${asset.key}`,
      private: asset.access === 'api_key'
    }
  })
})
