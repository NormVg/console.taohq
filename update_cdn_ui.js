import fs from 'fs'

let content = fs.readFileSync('pages/cdn/index.vue', 'utf-8')

content = content.replace(
  '<h1 class="list-title">CDN</h1>',
  `<div class="flex items-center gap-1 overflow-x-auto pb-1 text-[13px] font-semibold text-secondary whitespace-nowrap">
          <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
            <span v-if="idx > 0" class="mx-1 text-secondary/50">/</span>
            <button
              class="hover:text-primary transition-colors cursor-pointer"
              :class="{ 'text-primary': idx === breadcrumbs.length - 1 }"
              @click="navigateToFolder(crumb.id, idx)"
              @dragover.prevent
              @drop.prevent="onDropIntoFolder(crumb.id, $event)"
            >
              {{ crumb.name }}
            </button>
          </template>
        </div>`
)

content = content.replace(
  '<button class="icon-btn create-btn" title="Upload asset" @click="showUploadForm">',
  `<button class="icon-btn create-btn" title="New folder" @click="createNewFolder">
            <Icon name="lucide:folder-plus" class="w-4 h-4" />
          </button>
          <button class="icon-btn create-btn" title="Upload asset" @click="showUploadForm">`
)

content = content.replace(
  '<button\n            v-for="asset in filteredAssets"',
  `<!-- Folders -->
          <button
            v-for="folder in folders"
            :key="folder.id"
            class="entry-card folder-card group"
            @click="enterFolder(folder)"
            @dragover.prevent
            @drop.prevent="onDropIntoFolder(folder.id, $event)"
          >
            <div class="flex items-center gap-3">
              <Icon name="lucide:folder" class="w-5 h-5 text-secondary group-hover:text-primary transition-colors flex-shrink-0" />
              <span class="entry-title">{{ folder.name }}</span>
            </div>
            <button class="icon-btn opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" @click.stop="deleteFolder(folder)">
               <Icon name="lucide:trash" class="w-3.5 h-3.5" />
            </button>
          </button>

          <!-- Assets -->
          <button
            v-for="asset in filteredAssets"`
)

content = content.replace(
  ':class="[\'entry-card\', selectedKey === asset.key && \'selected\']"\n            @click="selectAsset(asset.key)"',
  `:class="['entry-card', selectedKey === asset.key && 'selected']"
            draggable="true"
            @dragstart="onDragAssetStart(asset, $event)"
            @click="selectAsset(asset.key)"`
)

content = content.replace(
  `const { data: assets, pending, refresh } = useFetch<any[]>('/api/cdn/assets')`,
  `const currentFolderId = ref<string | null>(null)
const breadcrumbs = ref<{ id: string | null; name: string }[]>([{ id: null, name: 'CDN' }])

const { data: folders, refresh: refreshFolders } = useFetch<any[]>('/api/folders', {
  query: computed(() => ({ type: 'cdn', parentId: currentFolderId.value || 'null' }))
})

const { data: assets, pending, refresh: refreshAssets } = useFetch<any[]>('/api/cdn/assets', {
  query: computed(() => ({ folderId: currentFolderId.value || 'null' }))
})

async function refresh() {
  await Promise.all([refreshFolders(), refreshAssets()])
}`
)

content = content.replace(
  `formData.append('access', uploadAccess.value)`,
  `formData.append('access', uploadAccess.value)
  if (currentFolderId.value) {
    formData.append('folderId', currentFolderId.value)
  }`
)

const methodsAdditions = `
function navigateToFolder(id: string | null, index: number) {
  currentFolderId.value = id
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  selectedKey.value = null
}

function enterFolder(folder: any) {
  currentFolderId.value = folder.id
  breadcrumbs.value.push({ id: folder.id, name: folder.name })
  selectedKey.value = null
}

async function createNewFolder() {
  const name = prompt('Folder name:')
  if (!name) return
  try {
    await $fetch('/api/folders', {
      method: 'POST',
      body: { name, type: 'cdn', parentId: currentFolderId.value }
    })
    await refreshFolders()
  } catch (e: any) {
    alert(e.data?.statusMessage || e.data?.error || 'Failed to create folder')
  }
}

async function deleteFolder(folder: any) {
  if (!confirm(\`Delete folder "\${folder.name}"? Must be empty.\`)) return
  try {
    await $fetch(\`/api/folders/\${folder.id}\`, { method: 'DELETE' })
    await refreshFolders()
  } catch (e: any) {
    alert(e.data?.statusMessage || e.data?.error || 'Failed to delete folder.')
  }
}

function onDragAssetStart(asset: any, e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.setData('application/json', JSON.stringify({ type: 'asset', key: asset.key }))
  }
}

async function onDropIntoFolder(targetFolderId: string | null, e: DragEvent) {
  const data = e.dataTransfer?.getData('application/json')
  if (!data) return
  const payload = JSON.parse(data)
  if (payload.type === 'asset') {
    try {
      await $fetch(\`/api/cdn/assets/\${encodeURIComponent(payload.key)}\`, {
        method: 'PATCH',
        body: { folderId: targetFolderId }
      })
      await refreshAssets()
    } catch (err) {
      alert('Failed to move asset')
    }
  }
}

function selectAsset(key: string) {`

content = content.replace('function selectAsset(key: string) {', methodsAdditions)

fs.writeFileSync('pages/cdn/index.vue', content)
console.log('CDN UI Updated')
