import { eq } from 'drizzle-orm'
import { useDb } from '../../../db/client'
import { cdnAssets } from '../../../db/schema'
import { hasConsoleAccess } from '../../../utils/cdnAuth'
import { downloadFromBucket0, sanitizeAssetPath } from '../../../utils/bucket0'

export default defineEventHandler(async (event) => {
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

  if (asset.access === 'api_key' && !(await hasConsoleAccess(event))) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }

  let body: Buffer
  let contentType = asset.mimeType

  try {
    const response = await downloadFromBucket0(asset.bucketKey)
    body = Buffer.from(await response.arrayBuffer())
    contentType = response.headers.get('content-type') || asset.mimeType
  } catch (error: any) {
    if (!asset.cacheData) {
      throw error
    }
    body = Buffer.from(asset.cacheData, 'base64')
  }

  const cacheControl = asset.access === 'public'
    ? 'public, max-age=31536000, immutable'
    : 'private, no-store'

  setResponseHeader(event, 'Content-Type', contentType)
  setResponseHeader(event, 'Content-Length', body.byteLength)
  setResponseHeader(event, 'Cache-Control', cacheControl)
  setResponseHeader(event, 'X-CDN-Asset-Key', asset.key)
  setResponseHeader(event, 'X-Bucket0-Destination', asset.destination)

  event.node.res.end(body)
})
