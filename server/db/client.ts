import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

// Singleton — reuse across requests in the same Nitro worker
let _db: ReturnType<typeof drizzle> | null = null

export function useDb() {
  if (_db) return _db

  const config  = useRuntimeConfig()
  const connStr = config.databaseUrl

  if (!connStr) {
    throw new Error('[db] DATABASE_URL is not set in environment / runtimeConfig.')
  }

  const client = postgres(connStr, { ssl: 'require', max: 5 })
  _db = drizzle(client, { schema })
  return _db
}
