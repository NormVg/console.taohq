import crypto from 'crypto'
import { getHeader, getQuery } from 'h3'
import { eq, and } from 'drizzle-orm'
import { useDb } from '../db/client'
import { apiKeys } from '../db/schema'

export function generateKey(): { full: string; prefix: string; hash: string } {
  // Generate random bytes for the key body
  const randomHex = crypto.randomBytes(24).toString('hex') // 48 hex chars
  const full = `tao_${randomHex}`
  const prefix = full.slice(0, 12)
  const hash = crypto.createHash('sha256').update(full).digest('hex')
  return { full, prefix, hash }
}

export function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

export async function validateApiKey(event: any): Promise<boolean> {
  // 1. Get header or query parameter
  const authHeader = getHeader(event, 'authorization')
  let token = ''
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else {
    const query = getQuery(event)
    if (query && typeof query.key === 'string') {
      token = query.key
    }
  }

  if (!token) {
    return false
  }

  // 2. Hash it
  const hash = hashKey(token)

  // 3. Find in database
  const db = useDb()
  const matchingKeys = await db.select()
    .from(apiKeys)
    .where(
      and(
        eq(apiKeys.hash, hash),
        eq(apiKeys.revoked, false)
      )
    )

  if (matchingKeys.length === 0) {
    return false
  }

  const keyRecord = matchingKeys[0]
  if (!keyRecord) {
    return false
  }

  // 4. Update lastUsedAt in the background
  try {
    await db.update(apiKeys)
      .set({ lastUsedAt: new Date() })
      .where(eq(apiKeys.id, keyRecord.id))
  } catch (err) {
    console.error('Failed to update API key last used timestamp:', err)
  }

  return true
}
