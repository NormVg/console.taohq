import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'

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

let s3Client: S3Client | null = null

export function getS3Client() {
  if (!s3Client) {
    const config = getS3Config()
    s3Client = new S3Client({
      region: 'auto',
      endpoint: 'https://s3.bucket0.com',
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      forcePathStyle: true
    })
  }
  return s3Client
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
  const s3 = getS3Client()
  
  const bytes = Buffer.from(file.data)
  
  try {
    await s3.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: path,
      Body: bytes,
      ContentType: file.type || 'application/octet-stream'
    }))
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
  const s3 = getS3Client()

  try {
    const response = await s3.send(new GetObjectCommand({
      Bucket: config.bucket,
      Key: key
    }))

    if (!response.Body) {
      throw new Error('Empty body')
    }

    const byteArray = await response.Body.transformToByteArray()
    
    return {
      data: Buffer.from(byteArray),
      contentType: response.ContentType || 'application/octet-stream'
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.$metadata?.httpStatusCode || 500,
      statusMessage: error.message || 'Bucket0 S3 download failed'
    })
  }
}

export async function deleteFromBucket0(key: string) {
  const config = getS3Config()
  const s3 = getS3Client()

  try {
    await s3.send(new DeleteObjectCommand({
      Bucket: config.bucket,
      Key: key
    }))
  } catch (error: any) {
    throw createError({
      statusCode: error.$metadata?.httpStatusCode || 500,
      statusMessage: error.message || 'Bucket0 S3 delete failed'
    })
  }
}
