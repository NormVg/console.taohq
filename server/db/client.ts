import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import * as schema from './schema'

export function useDb() {

  const config  = useRuntimeConfig()
  const connStr = config.databaseUrl

  if (!connStr) {
    throw new Error('[db] DATABASE_URL is not set in environment / runtimeConfig.')
  }

  const client = postgres(connStr, { ssl: 'require', max: 5 })
  return drizzle(client, { schema })
}
