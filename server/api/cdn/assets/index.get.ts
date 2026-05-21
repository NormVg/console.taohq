import { desc } from 'drizzle-orm'
import { useDb } from '../../../db/client'
import { cdnAssets } from '../../../db/schema'
import { requireConsoleAccess } from '../../../utils/cdnAuth'

export default defineEventHandler(async (event) => {
  await requireConsoleAccess(event)

  const db = useDb()
  const rows = await db
    .select()
    .from(cdnAssets)
    .orderBy(desc(cdnAssets.createdAt))

  return rows.map((asset) => {
    const { cacheData: _cacheData, ...safeAsset } = asset
    return {
      ...safeAsset,
      publicUrl: `/api/cdn/assets/${asset.key}`,
      private: asset.access === 'api_key'
    }
  })
})
