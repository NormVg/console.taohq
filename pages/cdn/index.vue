<template>
  <div class="cdn-page">
    <!-- Left Panel: Asset List -->
    <aside class="list-panel">
      <div class="list-header">
        <div class="flex items-center gap-1 overflow-x-auto pb-1 text-[13px] font-semibold text-secondary whitespace-nowrap">
          <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
            <span v-if="idx > 0" class="mx-1 text-secondary/50">/</span>
            <button
              class="hover:text-primary transition-colors cursor-pointer"
              :class="['flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md hover:bg-muted/50 transition-colors', idx === breadcrumbs.length - 1 ? 'text-primary' : '', dragHoverTarget === (crumb.id || '__root__') ? 'drag-hover-indicator' : '']"
              @click="navigateToFolder(crumb.id, idx)"
              @dragenter.prevent="onFolderDragEnter(crumb.id || '__root__')"
              @dragleave.prevent="onFolderDragLeave(crumb.id || '__root__')"
              @dragover.prevent
              @drop.prevent="onFolderDrop(crumb.id, $event)"
            >
              {{ crumb.name }}
            </button>
          </template>
        </div>

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
          <div
            v-for="folder in folders"
            :key="folder.id"
            role="button"
            tabindex="0"
            :class="['entry-card folder-card group', dragHoverTarget === folder.id ? 'drag-hover-indicator' : '']"
            style="flex-direction: row; align-items: center; gap: 12px;"
            @click="enterFolder(folder)"
            @keydown.enter.prevent="enterFolder(folder)"
            @dragenter.prevent="onFolderDragEnter(folder.id)"
            @dragleave.prevent="onFolderDragLeave(folder.id)"
            @dragover.prevent
            @drop.prevent="onFolderDrop(folder.id, $event)"
          >
            <Icon name="lucide:folder" class="w-5 h-5 text-secondary group-hover:text-primary transition-colors flex-shrink-0" style="pointer-events: none;" />
            <span class="entry-title" style="pointer-events: none;">{{ folder.name }}</span>
            <button class="icon-btn opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" @click.stop="deleteFolder(folder)">
               <Icon name="lucide:trash" class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- Assets -->
          <div
            v-for="asset in filteredAssets"
            :key="asset.key"
            role="button"
            tabindex="0"
            :class="['entry-card', selectedKey === asset.key && 'selected']"
            draggable="true"
            @dragstart="onDragAssetStart(asset, $event)"
            @click="selectAsset(asset.key)"
          >
            <div class="entry-top">
              <span class="entry-title">{{ asset.fileName }}</span>
              <GeistBadge :variant="asset.access === 'public' ? 'success' : 'warning'">
                {{ asset.access === 'public' ? 'public' : 'protected' }}
              </GeistBadge>
            </div>
            <div class="entry-route">/api/cdn/assets/{{ asset.key }}</div>
            <div class="entry-meta">
              <span>{{ formatBytes(asset.size) }}</span>
              <span class="meta-dot" />
              <span>{{ formatDate(asset.createdAt) }}</span>
              <span class="meta-dot" />
              <span>{{ asset.storageType || 'default' }}</span>
            </div>
          </div>
        </template>
      </div>
    </aside>

    <!-- Right Panel: Detail / Preview -->
    <main class="detail-panel">
      <!-- Upload Mode -->
      <template v-if="isUploading">
        <div class="action-bar">
          <div class="action-bar-left">
            <span class="action-bar-title">Upload Asset</span>
          </div>
        </div>

        <div class="detail-body">
          <div class="upload-zone-wrapper">
            <div
              class="upload-zone"
              @dragover.prevent="isDragOver = true"
              @dragleave.prevent="isDragOver = false"
              @drop.prevent="onDrop"
              :class="{ 'upload-zone--hover': isDragOver }"
            >
              <input
                type="file"
                ref="fileInputRef"
                @change="onFileChange"
                class="upload-zone-input"
              />
              <Icon name="lucide:upload-cloud" class="w-10 h-10 text-secondary mb-3" />
              <p class="text-[14px] text-primary font-medium">Click or drag file to upload</p>
              <p class="text-[12px] text-secondary mt-1">Max file size: 50MB</p>
            </div>

            <div v-if="selectedFile" class="selected-file-info">
              <Icon :name="getFileIcon(selectedFile.type)" class="w-4 h-4 text-secondary flex-shrink-0" />
              <span class="text-[13px] font-medium text-primary truncate">{{ selectedFile.name }}</span>
              <span class="text-[12px] text-secondary">({{ formatBytes(selectedFile.size) }})</span>
              <button class="icon-btn ml-auto" @click="clearFile" title="Remove file">
                <Icon name="lucide:x" class="w-3.5 h-3.5" />
              </button>
            </div>
            <div class="flex flex-col gap-1 w-full">
              <label class="text-[14px] text-secondary font-medium">Access Level</label>
              <select v-model="uploadAccess" class="access-select">
                <option value="public">Public</option>
                <option value="api_key">Protected (API Key required)</option>
              </select>
            </div>

            <div class="upload-actions">
              <GeistButton variant="secondary" size="sm" @click="cancelUpload">Cancel</GeistButton>
              <GeistButton size="sm" :loading="uploading" :disabled="!selectedFile" @click="uploadFile">Upload</GeistButton>
            </div>
          </div>
        </div>
      </template>

      <!-- Detail View -->
      <template v-else-if="selectedAsset">
        <div class="action-bar">
          <div class="action-bar-left">
            <GeistBadge :variant="selectedAsset.access === 'public' ? 'success' : 'warning'" class="mr-2 inline-flex align-middle">
              {{ selectedAsset.access === 'public' ? 'public' : 'protected' }}
            </GeistBadge>
            <span class="action-bar-title inline-flex align-middle">{{ selectedAsset.fileName }}</span>
          </div>

          <div class="tab-toggle">
            <button
              :class="['tab-btn', { active: activeTab === 'preview' }]"
              @click="activeTab = 'preview'"
            >
              Preview
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'api' }]"
              @click="activeTab = 'api'"
            >
              API
            </button>
          </div>

          <div class="action-bar-right">
            <GeistButton variant="tertiary" size="sm" @click="copyUrl" title="Copy URL">
              <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-3.5 h-3.5 mr-1" />
              <span>{{ copied ? 'Copied' : 'Copy URL' }}</span>
            </GeistButton>
            <GeistButton
              v-if="selectedAsset.publicUrl"
              variant="tertiary"
              size="sm"
              @click="openUrl(selectedAsset.publicUrl)"
              title="Open in new tab"
            >
              <Icon name="lucide:external-link" class="w-3.5 h-3.5 mr-1" />
              <span>Open</span>
            </GeistButton>
            <GeistButton variant="tertiary" size="sm" @click="downloadAsset" title="Download">
              <Icon name="lucide:download" class="w-3.5 h-3.5 mr-1" />
              <span>Download</span>
            </GeistButton>
            <GeistButton variant="error" size="sm" @click="deleteAsset" title="Delete">
              <Icon name="lucide:trash-2" class="w-3.5 h-3.5 mr-1" />
              <span>Delete</span>
            </GeistButton>
          </div>
        </div>

        <div class="detail-body">
          <!-- Preview Tab -->
          <template v-if="activeTab === 'preview'">
            <div class="preview-section">
              <div v-if="isImage(selectedAsset.mimeType)" class="preview-image-container">
                <div v-if="imageLoading" class="absolute inset-0 flex items-center justify-center rounded-lg bg-surface-2 z-10">
                  <Icon name="lucide:loader-2" class="w-6 h-6 animate-spin text-secondary" />
                </div>
                <img
                  :key="selectedAsset.key"
                  :src="selectedAsset.publicUrl"
                  :alt="selectedAsset.fileName"
                  class="preview-image"
                  :class="{ 'opacity-0': imageLoading, 'transition-opacity duration-200': true }"
                  @load="imageLoading = false"
                  @error="imageLoading = false"
                />
              </div>
              <div v-else class="preview-file-placeholder">
                <Icon :name="getFileIcon(selectedAsset.mimeType)" class="w-16 h-16 text-secondary" />
                <span class="text-[14px] text-secondary font-medium mt-3">{{ selectedAsset.fileName }}</span>
                <span class="text-[12px] text-secondary mt-1">{{ selectedAsset.mimeType }}</span>
              </div>
            </div>

            <div class="metadata-grid">
              <div class="metadata-item">
                <span class="metadata-label">Path</span>
                <span class="metadata-value font-mono">{{ selectedAsset.key }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Size</span>
                <span class="metadata-value">{{ formatBytes(selectedAsset.size) }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Type</span>
                <span class="metadata-value">{{ selectedAsset.mimeType }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Storage</span>
                <span class="metadata-value">{{ selectedAsset.storageType || 'default' }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Uploaded</span>
                <span class="metadata-value">{{ formatDate(selectedAsset.createdAt) }}</span>
              </div>
              <div class="metadata-item">
                <span class="metadata-label">Access</span>
                <span class="metadata-value capitalize">{{ selectedAsset.access }}</span>
              </div>
            </div>

            <div v-if="selectedAsset.publicUrl" class="url-section">
              <span class="metadata-label">URL</span>
              <CopyableText :text="selectedAsset.publicUrl" />
            </div>
          </template>

          <!-- API Tab -->
          <template v-else-if="activeTab === 'api'">
            <div class="api-docs">
              <div class="api-section">
                <h3 class="api-heading">GET Endpoint</h3>
                <p class="api-description">Retrieve this asset via HTTP GET request.</p>
                <CopyableText :text="`GET /api/cdn/assets/${selectedAsset.key}`" />
              </div>

              <div class="api-section">
                <h3 class="api-heading">cURL Example</h3>
                <p class="api-description">Download the asset from the command line.</p>
                <CopyableText :text="curlExample" />
              </div>

              <div v-if="isImage(selectedAsset.mimeType)" class="api-section">
                <h3 class="api-heading">HTML Embed</h3>
                <p class="api-description">Embed this image in your HTML page.</p>
                <CopyableText :text="htmlEmbed" />
              </div>

              <div v-if="selectedAsset.access === 'api_key'" class="api-section">
                <h3 class="api-heading">Authentication</h3>
                <p class="api-description">
                  This asset is protected. Include your API key in the request header.
                </p>
                <CopyableText :text="`Authorization: Bearer YOUR_API_KEY`" />
              </div>
            </div>
          </template>
        </div>
      </template>

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

import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'

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

// State
const selectedKey = ref<string | null>(null)
const imageLoading = ref(true)

watch(() => selectedKey.value, () => {
  imageLoading.value = true
})
const activeTab = ref<'preview' | 'api'>('preview')
const searchQuery = ref('')
const activeFilter = ref<'all' | 'public' | 'api_key'>('all')
const isUploading = ref(false)
const copied = ref(false)
const isDragOver = ref(false)

// Upload state
const fileInputRef = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const uploadPath = ref('')
const uploadAccess = ref('public')
const uploading = ref(false)

// Filters config
const filters = [
  { label: 'All', value: 'all' as const },
  { label: 'Public', value: 'public' as const },
  { label: 'Protected', value: 'api_key' as const },
]

// Computed
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
  return `${total} asset${total !== 1 ? 's' : ''} · ${publicCount} public · ${formatBytes(totalSize)}`
})

const curlExample = computed(() => {
  if (!selectedAsset.value) return ''
  const url = selectedAsset.value.publicUrl || `${window.location.origin}/api/cdn/assets/${selectedAsset.value.key}`
  if (selectedAsset.value.access === 'api_key') {
    return `curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  "${url}"`
  }
  return `curl -O "${url}"`
})

const htmlEmbed = computed(() => {
  if (!selectedAsset.value?.publicUrl) return ''
  return `<img src="${selectedAsset.value.publicUrl}" alt="${selectedAsset.value.fileName}" />`
})

const dragHoverTarget = ref<string | null | false>(false)
const dragCounters = reactive<Record<string, number>>({})

function onFolderDragEnter(folderId: string) {
  if (!dragCounters[folderId]) dragCounters[folderId] = 0
  dragCounters[folderId]++
  dragHoverTarget.value = folderId
}

function onFolderDragLeave(folderId: string) {
  if (!dragCounters[folderId]) dragCounters[folderId] = 0
  dragCounters[folderId]--
  if (dragCounters[folderId] <= 0) {
    dragCounters[folderId] = 0
    if (dragHoverTarget.value === folderId) dragHoverTarget.value = false
  }
}

function onFolderDrop(folderId: string | null, e: DragEvent) {
  dragHoverTarget.value = false
  Object.keys(dragCounters).forEach(k => dragCounters[k] = 0)
  onDropIntoFolder(folderId, e)
}

// Methods

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

async function onDropIntoFolder(targetFolderId: string | null, e: DragEvent) {
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

function selectAsset(key: string) {
  isUploading.value = false
  selectedKey.value = key
  activeTab.value = 'preview'
}

function showUploadForm() {
  isUploading.value = true
  selectedKey.value = null
  selectedFile.value = null
  uploadPath.value = ''
  uploadAccess.value = 'public'
}

function cancelUpload() {
  isUploading.value = false
  selectedFile.value = null
  uploadPath.value = ''
  uploadAccess.value = 'public'
}

function clearFile() {
  selectedFile.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

function onFileChange(e: Event) {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    const file = target.files[0]
    if (file.size > 50 * 1024 * 1024) {
      alert('File exceeds 50MB limit.')
      target.value = ''
      return
    }
    selectedFile.value = file
  }
}

function onDrop(e: DragEvent) {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.size > 50 * 1024 * 1024) {
      alert('File exceeds 50MB limit.')
      return
    }
    selectedFile.value = file
  }
}

async function uploadFile() {
  if (!selectedFile.value) return
  uploading.value = true

  const formData = new FormData()
  formData.append('file', selectedFile.value)
  if (uploadPath.value.trim()) {
    formData.append('path', uploadPath.value.trim())
  }
  formData.append('access', uploadAccess.value)
  if (currentFolderId.value) {
    formData.append('folderId', currentFolderId.value)
  }

  try {
    const result = await $fetch<any>('/api/cdn/assets', {
      method: 'POST',
      body: formData,
    })
    isUploading.value = false
    selectedFile.value = null
    uploadPath.value = ''
    uploadAccess.value = 'public'
    if (fileInputRef.value) fileInputRef.value.value = ''
    await refresh()
    // Select the newly uploaded asset
    const newKey = result?.key || uploadPath.value.trim() || null
    if (newKey) {
      selectedKey.value = newKey
      activeTab.value = 'preview'
    }
  } catch (e: any) {
    alert(e.data?.statusMessage || 'Upload failed')
    console.error(e)
  } finally {
    uploading.value = false
  }
}

async function deleteAsset() {
  if (!selectedAsset.value) return
  if (!confirm(`Delete asset: ${selectedAsset.value.key}?`)) return
  try {
    await $fetch(`/api/cdn/assets/${encodeURIComponent(selectedAsset.value.key)}`, { method: 'DELETE' })
    selectedKey.value = null
    refresh()
  } catch (e: any) {
    alert(e.data?.statusMessage || e.data?.error || 'Failed to delete asset')
  }
}

async function copyUrl() {
  if (!selectedAsset.value?.publicUrl) return
  try {
    await navigator.clipboard.writeText(selectedAsset.value.publicUrl)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}

function downloadAsset() {
  if (!selectedAsset.value?.publicUrl) return
  const a = document.createElement('a')
  a.href = selectedAsset.value.publicUrl
  a.download = selectedAsset.value.fileName || 'download'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function formatBytes(bytes: number, decimals = 2): string {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'dd MMM, hh:mm a')
}

function getFileIcon(mimeType: string): string {
  if (!mimeType) return 'lucide:file'
  if (mimeType.startsWith('image/')) return 'lucide:image'
  if (mimeType.startsWith('video/')) return 'lucide:video'
  if (mimeType === 'application/pdf') return 'lucide:file-text'
  if (mimeType.startsWith('text/')) return 'lucide:file-code-2'
  return 'lucide:file'
}

function isImage(mimeType: string): boolean {
  return mimeType?.startsWith('image/') || false
}
</script>

<style scoped>
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

.list-title {
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
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
  transition: background 150ms ease, color 150ms ease;
  min-height: 28px;
}

.filter-pill:hover {
  background: var(--bg-surface-2);
}

.filter-pill.active {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

.filter-pill:active {
  transform: scale(0.96);
}

/* ── Icon buttons ───────────────────────────── */
.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 6px;
  border: 1px solid var(--border-default);
  background: var(--bg-root);
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
  flex-shrink: 0;
}

.icon-btn:hover {
  background: var(--bg-surface-2);
  color: var(--text-primary);
}

.icon-btn:active {
  transform: scale(0.96);
}



.list-summary {
  padding: 4px 16px 8px;
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* ── Entry list ─────────────────────────────── */
.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 4px 12px 8px 12px;
}

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px 16px;
}

.entry-card {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  background: transparent;
  width: 100%;
  text-align: left;
  margin-bottom: 2px;
  transition: background 150ms ease, border-color 150ms ease;
}

.drag-hover-indicator {
  border: 1px dashed var(--text-secondary) !important;
  background: var(--bg-hover) !important;
}

.entry-card:hover {
  background: var(--bg-surface-2);
}

.entry-card.selected {
  background: var(--bg-surface-2);
  border-color: var(--border-default);
}

.entry-card:active {
  transform: scale(0.98);
}

.entry-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.entry-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
  line-height: 1.5;
  padding-bottom: 1px;
}

.entry-route {
  font-family: 'Geist Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.5;
  padding-bottom: 1px;
}

.entry-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-secondary);
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--border-default);
  flex-shrink: 0;
}

/* ── Right Panel ────────────────────────────── */
.detail-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-root);
  min-width: 0;
}

/* ── Action bar ─────────────────────────────── */
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 52px;
  min-height: 52px;
  padding: 0 24px;
  border-bottom: 1px solid var(--border-default);
  gap: 16px;
  flex-shrink: 0;
}

.action-bar-left {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-bar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.action-bar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* ── Tab toggle ─────────────────────────────── */
.tab-toggle {
  display: flex;
  align-items: center;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
  flex-shrink: 0;
}

.tab-btn {
  font-size: 13px;
  font-weight: 500;
  padding: 3px 13px; /* Reduced by 1px to compensate for border */
  border-radius: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  color: var(--text-secondary);
  background: transparent;
  transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease, border-color 150ms ease;
  min-height: 28px;
}

.tab-btn.active {
  background: var(--bg-root);
  color: var(--text-primary);
  border-color: var(--border-default);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.tab-btn:not(.active):hover {
  color: var(--text-primary);
}

.tab-btn:active {
  transform: scale(0.96);
}

.tab-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}



.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

/* ───── Preview Section ───── */
.preview-section {
  margin-bottom: 32px;
}

.preview-image-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 16px;
  min-height: 120px;
}

.preview-image {
  max-height: 400px;
  max-width: 100%;
  object-fit: contain;
  border-radius: 4px;
}

.preview-file-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: 8px;
}

/* ───── Metadata Grid ───── */
.metadata-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 24px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
}

.metadata-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-secondary);
  font-weight: 500;
  margin-bottom: 4px;
}

.metadata-value {
  font-size: 14px;
  color: var(--text-primary);
  word-break: break-all;
}

.url-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ───── API Docs ───── */
.api-docs {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.api-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-heading {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.api-description {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

/* ───── Empty State ───── */
.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

/* ───── Upload Zone ───── */
.upload-zone-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.upload-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  border: 2px dashed var(--border-default);
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;
}
.upload-zone:hover,
.upload-zone--hover {
  border-color: var(--text-secondary);
  background: var(--bg-surface-2);
}

.upload-zone-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.selected-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 8px;
}

.access-select {
  width: 100%;
  height: 32px;
  padding: 0 12px;
  background: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: 4px;
  color: var(--text-primary);
  font-size: 14px;
  transition: all 150ms ease;
  cursor: pointer;
}
.access-select:hover {
  border-color: var(--text-secondary);
}
.access-select:focus {
  outline: none;
  border-color: var(--blue-700);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}
</style>
