import { eq } from 'drizzle-orm'
import { readMultipartFormData } from 'h3'
import { useDb } from '../../../db/client'
import { cdnAssets } from '../../../db/schema'
import { requireConsoleAccess } from '../../../utils/cdnAuth'
import { sanitizeAssetPath, uploadToBucket0 } from '../../../utils/bucket0'

const MAX_FILE_BYTES = 50 * 1024 * 1024

export default defineEventHandler(async (event) => {
  await requireConsoleAccess(event)

  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.data)
  const rawPath = parts?.find(part => part.name === 'path')?.data?.toString()
  const rawAccess = parts?.find(part => part.name === 'access')?.data?.toString() || 'public'
  const folderId = parts?.find(part => part.name === 'folderId')?.data?.toString() || null

  if (!file) {
    throw createError({ statusCode: 400, statusMessage: 'Multipart file field is required' })
  }

  if (file.data.byteLength > MAX_FILE_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'File exceeds the 50 MB CDN API limit' })
  }

  if (!['public', 'api_key'].includes(rawAccess)) {
    throw createError({ statusCode: 400, statusMessage: 'access must be public or api_key' })
  }

  let finalPath = rawPath?.trim() || ''
  if (finalPath && finalPath.endsWith('/')) {
    finalPath += file.filename || ''
  } else if (!finalPath) {
    finalPath = file.filename || ''
  }
  const path = sanitizeAssetPath(finalPath)
  const bucketUpload = await uploadToBucket0({
    data: file.data,
    filename: file.filename,
    type: file.type
  }, path)
  const cacheData = Buffer.from(file.data).toString('base64')

  const db = useDb()
  const [asset] = await db
    .insert(cdnAssets)
    .values({
      key: path,
      fileName: bucketUpload.fileName,
      mimeType: file.type || 'application/octet-stream',
      size: bucketUpload.size,
      access: rawAccess,
      bucketKey: bucketUpload.key,
      destination: bucketUpload.destination,
      cacheData,
      folderId,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: cdnAssets.key,
      set: {
        fileName: bucketUpload.fileName,
        mimeType: file.type || 'application/octet-stream',
        size: bucketUpload.size,
        access: rawAccess,
        bucketKey: bucketUpload.key,
        destination: bucketUpload.destination,
        cacheData,
        folderId,
        updatedAt: new Date()
      }
    })
    .returning()

  if (!asset) {
    throw createError({ statusCode: 500, statusMessage: 'Failed to persist CDN asset metadata' })
  }

  setResponseStatus(event, 201)
  const { cacheData: _cacheData, ...safeAsset } = asset
  return {
    ...safeAsset,
    publicUrl: `/api/cdn/assets/${asset.key}`,
    private: asset.access === 'api_key'
  }
})
