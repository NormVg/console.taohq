import { useDb } from '../../db/client'
import { folders } from '../../db/schema'
import { requireConsoleAccess } from '../../utils/cdnAuth'

export default defineEventHandler(async (event) => {
  await requireConsoleAccess(event)
  const body = await readBody(event)

  if (!body.name || !body.type) {
    setResponseStatus(event, 400)
    return { error: 'name and type are required' }
  }

  const db = useDb()
  const [folder] = await db.insert(folders).values({
    name: body.name,
    type: body.type,
    parentId: body.parentId || null
  }).returning()

  return folder
})
