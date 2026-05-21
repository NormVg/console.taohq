const BUCKET0_BASE_URL = 'https://bucket0.com/api/agent-bucket'

type Bucket0UploadResponse = {
  success: boolean
  key: string
  fileName: string
  size: number
  destination?: string
}

export function getBucket0ApiKey(): string {
  const config = useRuntimeConfig()
  const key = config.bucket0ApiKey

  if (!key) {
    throw createError({
      statusCode: 500,
      statusMessage: 'BUCKET0_API_KEY is not configured'
    })
  }

  return key
}

export function sanitizeAssetPath(input: string): string {
  const cleaned = input
    .trim()
    .replace(/^\/+/, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._/-]/g, '_')
    .replace(/\/+/g, '/')

  if (!cleaned || cleaned.includes('..') || cleaned.endsWith('/')) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid asset path'
    })
  }

  return cleaned
}

export function inferFileName(path: string): string {
  return path.split('/').filter(Boolean).at(-1) || path
}

export async function uploadToBucket0(file: { data: Uint8Array; filename?: string; type?: string }, path: string) {
  const form = new FormData()
  const bytes = Buffer.from(file.data)
  const blob = new Blob([bytes], { type: file.type || 'application/octet-stream' })
  form.append('file', blob, file.filename || inferFileName(path))
  form.append('filename', path)

  const response = await fetch(`${BUCKET0_BASE_URL}/files/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getBucket0ApiKey()}`
    },
    body: form
  })

  const payload = await response.json().catch(() => null) as Bucket0UploadResponse | null

  if (!response.ok || !payload?.success) {
    throw createError({
      statusCode: response.status || 502,
      statusMessage: payload ? JSON.stringify(payload) : 'Bucket0 upload failed'
    })
  }

  return {
    key: payload.key,
    fileName: payload.fileName,
    size: payload.size,
    destination: payload.destination || 'unknown'
  }
}

export async function downloadFromBucket0(key: string) {
  const response = await fetch(`${BUCKET0_BASE_URL}/files/download?key=${encodeURIComponent(key)}`, {
    headers: {
      Authorization: `Bearer ${getBucket0ApiKey()}`
    }
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      statusMessage: 'Bucket0 download failed'
    })
  }

  return response
}

export async function deleteFromBucket0(key: string) {
  const response = await fetch(`${BUCKET0_BASE_URL}/files?key=${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getBucket0ApiKey()}`
    }
  })

  if (!response.ok && response.status !== 404) {
    throw createError({
      statusCode: response.status,
      statusMessage: 'Bucket0 delete failed'
    })
  }
}
