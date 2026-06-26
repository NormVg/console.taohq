import fs from 'fs'
const files = [
  'server/api/folders/[id].delete.ts',
  'server/api/folders/index.get.ts',
  'server/api/folders/index.post.ts',
]
for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8')
  content = content.replace(/import \{ (.*?) \} from '\.\.\/\.\.\/\.\.\/(db|utils)/g, "import { $1 } from '../../$2")
  fs.writeFileSync(file, content)
}
console.log('Fixed imports')
