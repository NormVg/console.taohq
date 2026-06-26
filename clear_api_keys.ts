import { useDb } from './server/db/client'
import { apiKeys } from './server/db/schema'
async function main() {
  const db = useDb()
  console.log('Truncating api_keys table...')
  await db.delete(apiKeys)
  console.log('Done.')
  process.exit(0)
}
main()
