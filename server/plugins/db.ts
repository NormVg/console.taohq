import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { useDb } from '../db/client'
import { resolveMigrationsDir } from '../utils/migrationsPath'

export default defineNitroPlugin(async () => {
  const db = useDb()

  try {
    // const migrationsFolder = resolveMigrationsDir()
    // await migrate(db, { migrationsFolder })
  } catch (err) {
    console.error('[db] ⚠ drizzle migrate:', err)
  }

  console.log('[db] ✔ migrations ready')
})
