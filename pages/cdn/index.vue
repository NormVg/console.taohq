<template>
  <div class="cdn-page">
    <!-- Left Panel: Asset List -->
    <aside class="list-panel">
      <div class="list-header">
        <FolderBreadcrumbs
          :breadcrumbs="breadcrumbs"
          @navigate="navigateToFolder"
          @drop="onFolderDrop"
        />

        <div class="search-row">
          <GeistInput
            v-model="searchQuery"
            placeholder="Search assets…"
            size="sm"
            class="flex-1"
          >
            <template #prefix>
              <Icon name="lucide:search" class="w-3.5 h-3.5" />
            </template>
          </GeistInput>
          <button class="icon-btn create-btn" title="New folder" @click="createNewFolder">
            <Icon name="lucide:folder-plus" class="w-4 h-4" />
          </button>
          <button class="icon-btn create-btn" title="Upload asset" @click="showUploadForm">
            <Icon name="lucide:plus" class="w-4 h-4" />
          </button>
        </div>

        <div class="filter-row">
          <div class="filter-pills">
            <button
              v-for="f in filters"
              :key="f.value"
              :class="['filter-pill', activeFilter === f.value && 'active']"
              @click="activeFilter = f.value"
            >
              {{ f.label }}
            </button>
          </div>
          <button class="icon-btn" title="Refresh" @click="refresh()">
            <Icon name="lucide:refresh-cw" class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div v-if="!pending && filteredAssets?.length" class="list-summary">
        {{ assetSummary }}
      </div>

      <div class="list-body">
        <div v-if="pending" class="list-empty">
          <Icon name="lucide:loader-2" class="w-5 h-5 text-secondary animate-spin" />
          <span class="text-[13px] text-secondary mt-2">Loading…</span>
        </div>

        <div v-else-if="!filteredAssets?.length && !folders?.length" class="list-empty">
          <Icon name="lucide:inbox" class="w-6 h-6 text-secondary" />
          <span class="text-[13px] text-secondary mt-2">No assets found</span>
        </div>

        <template v-else>
          <!-- Folders -->
          <FolderList
            :folders="folders || []"
            @enter="enterFolder"
            @delete="deleteFolder"
            @drop="onFolderDrop"
          />

          <!-- Assets -->
          <AssetCard
            v-for="asset in filteredAssets"
            :key="asset.key"
            :asset="asset"
            :is-selected="selectedKey === asset.key"
            @select="selectAsset"
            @dragstart="onDragAssetStart"
          />
        </template>
      </div>
    </aside>

    <!-- Right Panel: Detail / Preview -->
    <main class="detail-panel">
      <!-- Upload Mode -->
      <UploadPanel
        v-if="isUploading"
        :current-folder-id="currentFolderId"
        @cancel="isUploading = false"
        @uploaded="onUploaded"
      />

      <!-- Detail View -->
      <AssetDetail
        v-else-if="selectedAsset"
        :selected-asset="selectedAsset"
        @deleted="onAssetDeleted"
      />

      <!-- Empty State -->
      <template v-else>
        <div class="empty-state">
          <Icon name="lucide:image" class="w-12 h-12 text-secondary" />
          <h2 class="text-[16px] font-semibold text-primary mt-4">Select an asset</h2>
          <p class="text-[13px] text-secondary mt-1">Choose an asset from the list or upload a new one</p>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

import { ref, computed } from 'vue'
import FolderBreadcrumbs from '~/components/FolderBreadcrumbs.vue'
import FolderList from '~/components/FolderList.vue'
import AssetCard from '~/components/cdn/AssetCard.vue'
import UploadPanel from '~/components/cdn/UploadPanel.vue'
import AssetDetail from '~/components/cdn/AssetDetail.vue'

// ── State ──────────────────────────────────────
const currentFolderId = ref<string | null>(null)
const breadcrumbs = ref<{ id: string | null; name: string }[]>([{ id: null, name: 'CDN' }])

const { data: folders, refresh: refreshFolders } = useFetch<any[]>('/api/folders', {
  query: computed(() => ({ type: 'cdn', parentId: currentFolderId.value || 'null' }))
})

const { data: assets, pending, refresh: refreshAssets } = useFetch<any[]>('/api/cdn/assets', {
  query: computed(() => ({ folderId: currentFolderId.value || 'null' }))
})

async function refresh() {
  await Promise.all([refreshFolders(), refreshAssets()])
}

const searchQuery = ref('')
const activeFilter = ref<'all' | 'public' | 'api_key'>('all')

const selectedKey = ref<string | null>(null)
const isUploading = ref(false)

const filters = [
  { label: 'All', value: 'all' as const },
  { label: 'Public', value: 'public' as const },
  { label: 'Protected', value: 'api_key' as const },
]

// ── Computed ───────────────────────────────────
const filteredAssets = computed(() => {
  if (!assets.value) return []
  let result = [...assets.value]

  if (activeFilter.value !== 'all') {
    result = result.filter(a => a.access === activeFilter.value)
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    result = result.filter(a =>
      a.fileName?.toLowerCase().includes(q) ||
      a.key?.toLowerCase().includes(q)
    )
  }

  return result
})

const selectedAsset = computed(() => {
  if (!selectedKey.value || !assets.value) return null
  return assets.value.find((a: any) => a.key === selectedKey.value) || null
})

const assetSummary = computed(() => {
  const list = filteredAssets.value
  if (!list.length) return 'No assets'
  const total = list.length
  const publicCount = list.filter((a: any) => a.access === 'public').length
  const totalSize = list.reduce((sum: number, a: any) => sum + (a.size || 0), 0)
  
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  return `${total} asset${total !== 1 ? 's' : ''} · ${publicCount} public · ${formatBytes(totalSize)}`
})

// ── Folder Drag & Drop ─────────────────────────
async function onFolderDrop(targetFolderId: string | null, e: DragEvent) {
  const data = e.dataTransfer?.getData('text/plain') || e.dataTransfer?.getData('application/json')
  if (!data) return
  const payload = JSON.parse(data)
  if (payload.type === 'asset') {
    try {
      await $fetch(`/api/cdn/assets/${encodeURIComponent(payload.key)}`, {
        method: 'PATCH',
        body: { folderId: targetFolderId }
      })
      await refreshAssets()
    } catch (err) {
      alert('Failed to move asset')
    }
  }
}

// ── Actions ────────────────────────────────────
function navigateToFolder(id: string | null, index: number) {
  currentFolderId.value = id
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  selectedKey.value = null
  isUploading.value = false
}

function enterFolder(folder: any) {
  currentFolderId.value = folder.id
  breadcrumbs.value.push({ id: folder.id, name: folder.name })
  selectedKey.value = null
  isUploading.value = false
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
  if (!confirm(`Delete folder "${folder.name}"? Must be empty.`)) return
  try {
    await $fetch(`/api/folders/${folder.id}`, { method: 'DELETE' })
    await refreshFolders()
  } catch (e: any) {
    alert(e.data?.statusMessage || e.data?.error || 'Failed to delete folder.')
  }
}

function onDragAssetStart(asset: any, e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'asset', key: asset.key }))
  }
}

function selectAsset(key: string) {
  isUploading.value = false
  selectedKey.value = key
}

function showUploadForm() {
  isUploading.value = true
  selectedKey.value = null
}

async function onUploaded(newKey: string | null) {
  isUploading.value = false
  await refresh()
  if (newKey) {
    selectedKey.value = newKey
  }
}

function onAssetDeleted() {
  selectedKey.value = null
  refresh()
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────── */
.cdn-page {
  display: flex;
  height: 100%;
  overflow: hidden;
}

/* ── Left Panel ─────────────────────────────── */
.list-panel {
  width: 300px;
  min-width: 300px;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border-default);
  background: var(--bg-root);
  overflow: hidden;
}

.list-header {
  padding: 16px 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex-shrink: 0;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

.filter-pills {
  display: flex;
  gap: 2px;
}

.filter-pill {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
  border-radius: 9999px;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 150ms ease;
}

.filter-pill:hover {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

.filter-pill.active {
  background: var(--text-primary);
  color: var(--bg-root);
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: var(--text-secondary);
  transition: all 150ms ease;
  background: transparent;
  border: none;
  cursor: pointer;
}

.icon-btn:hover {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

.icon-btn.create-btn {
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
}

.icon-btn.create-btn:hover {
  border-color: var(--text-secondary);
  color: var(--text-primary);
}

.list-summary {
  padding: 0 16px 8px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
}

.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 16px 16px;
  display: flex;
  flex-direction: column;
}

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
  color: var(--text-secondary);
}

/* ── Right Panel ────────────────────────────── */
.detail-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg-surface);
  min-width: 0;
  overflow: hidden;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
}
</style>
