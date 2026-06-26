import { AwsClient } from 'aws4fetch'

export function getS3Config() {
  const config = useRuntimeConfig()
  
  if (!config.bucket0S3AccessKeyId || !config.bucket0S3SecretAccessKey || !config.bucket0S3Bucket) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Bucket0 S3 credentials are not configured'
    })
  }

  return {
    accessKeyId: config.bucket0S3AccessKeyId,
    secretAccessKey: config.bucket0S3SecretAccessKey,
    bucket: config.bucket0S3Bucket
  }
}

export function getAwsClient() {
  const config = getS3Config()
  return new AwsClient({
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    service: 's3',
    region: 'auto',
  })
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
  const config = getS3Config()
  const aws = getAwsClient()
  
  const bytes = file.data
  
  try {
    const url = `https://s3.bucket0.com/${config.bucket}/${path}`
    const res = await aws.fetch(url, {
      method: 'PUT',
      body: bytes,
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      }
    })
    
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status} ${res.statusText}`)
    }
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      statusMessage: error.message || 'Bucket0 S3 upload failed'
    })
  }

  return {
    key: path,
    fileName: file.filename || inferFileName(path),
    size: bytes.byteLength,
    destination: 's3'
  }
}

export async function downloadFromBucket0(key: string) {
  const config = getS3Config()
  const aws = getAwsClient()

  try {
    const url = `https://s3.bucket0.com/${config.bucket}/${key}`
    const res = await aws.fetch(url, { method: 'GET' })

    if (!res.ok) {
      throw new Error(`Download failed: ${res.status} ${res.statusText}`)
    }

    const arrayBuffer = await res.arrayBuffer()
    const { Buffer } = await import('node:buffer')
    
    return {
      data: Buffer.from(arrayBuffer),
      contentType: res.headers.get('Content-Type') || 'application/octet-stream'
    }
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      statusMessage: error.message || 'Bucket0 S3 download failed'
    })
  }
}

export async function deleteFromBucket0(key: string) {
  const config = getS3Config()
  const aws = getAwsClient()

  try {
    const url = `https://s3.bucket0.com/${config.bucket}/${key}`
    const res = await aws.fetch(url, { method: 'DELETE' })
    if (!res.ok && res.status !== 404) {
      throw new Error(`Delete failed: ${res.status} ${res.statusText}`)
    }
    return true
  } catch (error: any) {
    throw createError({
      statusCode: 502,
      statusMessage: error.message || 'Bucket0 S3 delete failed'
    })
  }
}
