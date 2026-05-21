import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

/** Resolve migrations dir from project root (Nitro bundle breaks import.meta.url relative paths). */
export function resolveMigrationsDir(): string {
  const dir = resolve(process.cwd(), 'server/db/migrations')
  const journal = join(dir, 'meta/_journal.json')
  if (!existsSync(journal)) {
    throw new Error(`Missing Drizzle journal at ${journal}`)
  }
  return dir
}
