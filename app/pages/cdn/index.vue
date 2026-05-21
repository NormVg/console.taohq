<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCdnStore, type CdnAsset } from '../../stores/cdn'
import {
  HardDriveIcon,
  PlusIcon,
  UploadIcon,
  Trash2Icon,
  CopyIcon,
  CheckIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  BookOpenIcon,
  GlobeIcon,
  LockIcon,
  SearchIcon,
  FileIcon,
  FileImageIcon,
  FileVideoIcon,
  FileAudioIcon,
  FileCodeIcon,
  DownloadIcon,
} from 'lucide-vue-next'

const cdnStore = useCdnStore()
const { toast } = useToast()

const searchQuery = ref('')
const accessFilter = ref<'all' | 'public' | 'api_key'>('all')
const selectedAssetId = ref<string | null>(null)
const isUploading = ref(false)
const isConfirmDeleteOpen = ref(false)
const assetToDelete = ref<CdnAsset | null>(null)
const deleting = ref(false)
const copiedKey = ref<string | null>(null)
const rightTab = ref<'preview' | 'api'>('preview')

const DEFAULT_PATH_PREFIX = 'assets/'

const uploadFiles = ref<File[]>([])
const uploadPath = ref(DEFAULT_PATH_PREFIX)
const uploadAccess = ref<'public' | 'api_key'>('public')
const fileInputRef = ref<HTMLInputElement | null>(null)

const canUpload = computed(
  () => !!uploadFiles.value[0] && uploadPath.value.trim().length > 0
)

function suggestPath(filename: string) {
  const base = filename.trim().replace(/^\/+/, '').replace(/\s+/g, '-')
  const safe = base.replace(/[^a-zA-Z0-9._/-]/g, '_')
  if (!safe) return DEFAULT_PATH_PREFIX.slice(0, -1) || 'asset'
  if (safe.includes('/')) return safe
  return `${DEFAULT_PATH_PREFIX}${safe}`
}

function setUploadFile(file: File | null) {
  if (!file) {
    uploadFiles.value = []
    return
  }
  uploadFiles.value = [file]
  uploadPath.value = suggestPath(file.name)
}

function resetFileInput() {
  if (fileInputRef.value) fileInputRef.value.value = ''
}

onMounted(async () => {
  await cdnStore.fetchAssets()
  if (cdnStore.assets.length > 0) {
    selectedAssetId.value = cdnStore.assets[0].id
  }
})

watch(
  () => cdnStore.assets,
  (assets) => {
    if (isUploading.value) return
    if (!assets.length) {
      selectedAssetId.value = null
      return
    }
    if (!selectedAssetId.value || !assets.find(a => a.id === selectedAssetId.value)) {
      selectedAssetId.value = assets[0].id
    }
  },
  { deep: true }
)

const baseUrl = computed(() =>
  typeof window !== 'undefined' ? window.location.origin : ''
)

const filteredAssets = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return cdnStore.assets.filter((asset) => {
    const matchesAccess =
      accessFilter.value === 'all' || asset.access === accessFilter.value
    const matchesSearch =
      !q ||
      asset.key.toLowerCase().includes(q) ||
      asset.fileName.toLowerCase().includes(q) ||
      asset.mimeType.toLowerCase().includes(q)
    return matchesAccess && matchesSearch
  })
})

const selectedAsset = computed(() =>
  cdnStore.assets.find(a => a.id === selectedAssetId.value) ?? null
)

const statsLine = computed(() => {
  const total = cdnStore.assets.length
  const pub = cdnStore.assets.filter(a => a.access === 'public').length
  const bytes = cdnStore.assets.reduce((s, a) => s + a.size, 0)
  return `${total} asset${total === 1 ? '' : 's'} · ${pub} public · ${formatBytes(bytes)}`
})

const curlPublic = computed(() => {
  const key = selectedAsset.value?.key || 'images/example.png'
  return `curl -X GET '${baseUrl.value}/api/cdn/assets/${key}'`
})

const curlProtected = computed(() => {
  const key = selectedAsset.value?.key || 'private/doc.pdf'
  return `curl -X GET '${baseUrl.value}/api/cdn/assets/${key}' \\\n  -H 'Authorization: Bearer YOUR_API_KEY'`
})

const curlUpload = computed(
  () =>
    `curl -X POST '${baseUrl.value}/api/cdn/assets' \\\n  -H 'Authorization: Bearer YOUR_API_KEY' \\\n  -F 'file=@./photo.jpg' \\\n  -F 'path=images/photo.jpg' \\\n  -F 'access=public'`
)

const startUpload = () => {
  selectedAssetId.value = null
  isUploading.value = true
  uploadFiles.value = []
  uploadPath.value = DEFAULT_PATH_PREFIX
  uploadAccess.value = 'public'
  rightTab.value = 'preview'
  resetFileInput()
}

const selectAsset = (id: string) => {
  selectedAssetId.value = id
  isUploading.value = false
  rightTab.value = 'preview'
}

const handleRefresh = async () => {
  await cdnStore.fetchAssets()
  toast({ title: 'Refreshed', description: 'CDN assets updated.', intent: 'success', duration: 1500 })
}

const onFileInputChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  setUploadFile(file)
}

const onDropFiles = (event: DragEvent) => {
  event.preventDefault()
  const file = event.dataTransfer?.files?.[0] ?? null
  if (!file) return
  setUploadFile(file)
  resetFileInput()
}

const openFilePicker = () => {
  if (cdnStore.uploading) return
  fileInputRef.value?.click()
}

const handleUpload = async () => {
  const file = uploadFiles.value[0]
  if (!file) {
    toast({ title: 'No file', description: 'Choose a file to upload.', intent: 'danger' })
    return
  }
  if (file.size > 50 * 1024 * 1024) {
    toast({ title: 'Too large', description: 'Maximum file size is 50 MB.', intent: 'danger' })
    return
  }
  const path = uploadPath.value.trim().replace(/\/+$/, '') || suggestPath(file.name)
  try {
    const asset = await cdnStore.uploadAsset(file, {
      path,
      access: uploadAccess.value
    })
    toast({
      title: 'Uploaded',
      description: `"${file.name}" is now on the CDN.`,
      intent: 'success'
    })
    isUploading.value = false
    selectedAssetId.value = asset.id
  } catch (err: any) {
    toast({
      title: 'Upload failed',
      description: err.data?.statusMessage || err.message || 'Could not upload file.',
      intent: 'danger'
    })
  }
}

const assetUrl = (asset: CdnAsset) => `${baseUrl.value}${asset.publicUrl}`

const openAsset = (asset: CdnAsset) => {
  window.open(assetUrl(asset), '_blank', 'noopener,noreferrer')
}

const downloadAsset = async (asset: CdnAsset) => {
  try {
    const url = assetUrl(asset)
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.style.display = 'none'
    a.href = blobUrl
    a.download = asset.fileName || 'download'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(blobUrl)
    document.body.removeChild(a)
    toast({ title: 'Downloading', description: `Started downloading ${asset.fileName}`, intent: 'info' })
  } catch (error) {
    toast({ title: 'Download failed', description: 'Could not download the asset.', intent: 'danger' })
  }
}

const copyUrl = async (asset?: CdnAsset | null) => {
  const target = asset ?? selectedAsset.value
  if (!target) return
  try {
    await navigator.clipboard.writeText(assetUrl(target))
    copiedKey.value = target.key
    toast({ title: 'Copied', description: 'Asset URL copied.', intent: 'success', duration: 2000 })
    setTimeout(() => { copiedKey.value = null }, 2000)
  } catch {
    toast({ title: 'Failed to copy', description: 'Could not copy URL.', intent: 'danger' })
  }
}

const confirmDelete = (asset?: CdnAsset | null) => {
  const target = asset ?? selectedAsset.value
  if (!target) return
  assetToDelete.value = target
  isConfirmDeleteOpen.value = true
}

const handleDelete = async () => {
  if (!assetToDelete.value) return
  deleting.value = true
  try {
    await cdnStore.deleteAsset(assetToDelete.value.key)
    toast({
      title: 'Deleted',
      description: `"${assetToDelete.value.key}" removed.`,
      intent: 'info'
    })
    isConfirmDeleteOpen.value = false
    assetToDelete.value = null
  } catch (err: any) {
    toast({
      title: 'Delete failed',
      description: err.message || 'Could not delete asset.',
      intent: 'danger'
    })
  } finally {
    deleting.value = false
  }
}

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const displayName = (asset: CdnAsset) =>
  asset.fileName || asset.key.split('/').filter(Boolean).at(-1) || asset.key

const isImage = (mime: string) => mime.startsWith('image/')
const isVideo = (mime: string) => mime.startsWith('video/')
const isAudio = (mime: string) => mime.startsWith('audio/')
const isCode = (mime: string) =>
  mime.includes('json') || mime.includes('javascript') || mime.includes('xml') || mime.includes('svg')

const fileIcon = (mime: string) => {
  if (isImage(mime)) return FileImageIcon
  if (isVideo(mime)) return FileVideoIcon
  if (isAudio(mime)) return FileAudioIcon
  if (isCode(mime)) return FileCodeIcon
  return FileIcon
}
</script>

<template>
  <ConsoleShell page-title="CDN">
    <div class="cdn-workspace">

      <!-- LEFT: Asset list -->
      <div class="list-panel">
        <div class="list-toolbar">
          <div class="search-wrap">
            <SearchIcon class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search..."
              class="search-input"
            />
          </div>
          <MayaBtn size="icon" variant="outline" title="Upload asset" @click="startUpload">
            <PlusIcon :size="16" />
          </MayaBtn>
        </div>

        <div class="filter-bar">
          <div class="filter-pills">
            <button
              class="pill"
              :class="{ active: accessFilter === 'all' }"
              @click="accessFilter = 'all'"
            >All</button>
            <button
              class="pill"
              :class="{ active: accessFilter === 'public' }"
              @click="accessFilter = 'public'"
            >Public</button>
            <button
              class="pill"
              :class="{ active: accessFilter === 'api_key' }"
              @click="accessFilter = 'api_key'"
            >Protected</button>
          </div>
          <button class="refresh-btn" title="Refresh" @click="handleRefresh">
            <RefreshCwIcon class="refresh-icon" :class="{ spinning: cdnStore.loading }" />
          </button>
        </div>

        <div v-if="cdnStore.assets.length > 0" class="stats-strip">
          {{ statsLine }}
        </div>

        <div class="entries-scroll">
          <div v-if="cdnStore.loading && cdnStore.assets.length === 0" class="list-empty">
            <MayaSpinner size="md" />
            <span>Loading...</span>
          </div>

          <div v-else-if="cdnStore.assets.length === 0" class="list-empty">
            <HardDriveIcon class="empty-icon" />
            <span>No assets yet</span>
            <MayaBtn size="sm" variant="outline" @click="startUpload">
              <UploadIcon :size="13" />
              Upload
            </MayaBtn>
          </div>

          <div v-else-if="filteredAssets.length === 0" class="list-empty">
            <SearchIcon class="empty-icon" />
            <span>No matches</span>
          </div>

          <div v-else class="entries-list">
            <button
              v-for="asset in filteredAssets"
              :key="asset.id"
              type="button"
              class="entry-item"
              :class="{ active: selectedAssetId === asset.id && !isUploading }"
              @click="selectAsset(asset.id)"
            >
              <div class="entry-top">
                <span class="entry-name">{{ displayName(asset) }}</span>
                <MayaBadge
                  size="sm"
                  variant="soft"
                  :intent="asset.private ? 'warning' : 'success'"
                >
                  {{ asset.private ? 'Protected' : 'Public' }}
                </MayaBadge>
              </div>
              <div class="entry-slug">/api/cdn/assets/{{ asset.key }}</div>
              <div class="entry-meta">
                <span>{{ formatBytes(asset.size) }} · {{ formatTime(asset.createdAt) }}</span>
                <div class="status-indicator">
                  <div class="status-dot" :class="{ live: !asset.private }" />
                  <span>{{ asset.destination }}</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT: Detail / Upload -->
      <div class="detail-panel">

        <!-- Empty -->
        <div v-if="!selectedAsset && !isUploading" class="detail-empty">
          <MayaEmptyState
            :icon="HardDriveIcon"
            title="No asset selected"
            description="Pick a file from the list or upload a new asset to preview and manage it."
          >
            <template #action>
              <MayaBtn @click="startUpload">
                <UploadIcon :size="14" />
                Upload asset
              </MayaBtn>
            </template>
          </MayaEmptyState>
        </div>

        <!-- Upload workspace -->
        <div v-else-if="isUploading" class="detail-workspace">
          <div class="detail-header">
            <div class="detail-header-left">
              <MayaBadge size="sm" variant="muted" intent="success">New</MayaBadge>
              <span class="detail-title">Upload asset</span>
            </div>
          </div>

          <div class="detail-body">
            <p class="upload-hint">
              Files go to Bucket0 (Drive). Max 50 MB. Public assets need no key; protected assets require a bearer token.
            </p>

            <input
              ref="fileInputRef"
              type="file"
              class="file-input-hidden"
              accept="*/*"
              @change="onFileInputChange"
            />

            <button
              type="button"
              class="drop-zone"
              :class="{ 'has-file': !!uploadFiles[0] }"
              :disabled="cdnStore.uploading"
              @click="openFilePicker"
              @dragover.prevent
              @drop="onDropFiles"
            >
              <UploadIcon :size="22" class="drop-zone-icon" />
              <span class="drop-zone-title">
                {{ uploadFiles[0] ? uploadFiles[0].name : 'Drop a file or click to browse' }}
              </span>
              <span class="drop-zone-hint">Max 50 MB · path fills in automatically</span>
            </button>

            <div v-if="uploadFiles[0]" class="selected-file">
              <component :is="fileIcon(uploadFiles[0].type)" :size="16" />
              <span class="selected-file-name">{{ uploadFiles[0].name }}</span>
              <span class="selected-file-size">{{ formatBytes(uploadFiles[0].size) }}</span>
            </div>

            <div class="form-grid">
              <div class="field span-2">
                <label class="field-label">Asset path</label>
                <MayaInput
                  v-model="uploadPath"
                  placeholder="assets/my-file.png"
                />
                <span class="field-hint">Pre-filled from the filename — edit to add folders (e.g. images/hero.webp).</span>
              </div>

              <div class="field span-2">
                <label class="field-label">Access</label>
                <div class="access-control">
                  <button
                    type="button"
                    class="access-option"
                    :class="{ active: uploadAccess === 'public' }"
                    @click="uploadAccess = 'public'"
                  >
                    <GlobeIcon :size="14" />
                    <span>Public</span>
                  </button>
                  <button
                    type="button"
                    class="access-option"
                    :class="{ active: uploadAccess === 'api_key' }"
                    @click="uploadAccess = 'api_key'"
                  >
                    <LockIcon :size="14" />
                    <span>Protected</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="upload-actions">
              <MayaBtn variant="outline" :disabled="cdnStore.uploading" @click="isUploading = false">
                Cancel
              </MayaBtn>
              <MayaBtn
                class="upload-btn"
                :disabled="cdnStore.uploading || !canUpload"
                @click="handleUpload"
              >
                <MayaSpinner v-if="cdnStore.uploading" class="upload-btn-spinner" size="sm" />
                <UploadIcon v-else :size="14" />
                {{ cdnStore.uploading ? 'Uploading…' : 'Upload' }}
              </MayaBtn>
            </div>
          </div>
        </div>

        <!-- Asset detail -->
        <div v-else-if="selectedAsset" class="detail-workspace">
          <div class="detail-header">
            <div class="detail-header-left">
              <MayaBadge
                size="sm"
                variant="soft"
                :intent="selectedAsset.private ? 'warning' : 'success'"
              >
                {{ selectedAsset.private ? 'Protected' : 'Public' }}
              </MayaBadge>
              <span class="detail-title">{{ displayName(selectedAsset) }}</span>
            </div>

            <div class="tab-switcher">
              <button
                type="button"
                class="tab-btn"
                :class="{ active: rightTab === 'preview' }"
                @click="rightTab = 'preview'"
              >Preview</button>
              <button
                type="button"
                class="tab-btn"
                :class="{ active: rightTab === 'api' }"
                @click="rightTab = 'api'"
              >
                <BookOpenIcon :size="12" />
                API
              </button>
            </div>

            <div class="detail-header-right">
              <button type="button" class="api-link" @click="copyUrl(selectedAsset)">
                <CheckIcon v-if="copiedKey === selectedAsset.key" :size="12" />
                <CopyIcon v-else :size="12" />
                Copy URL
              </button>
              <button type="button" class="api-link" @click="openAsset(selectedAsset)">
                <ExternalLinkIcon :size="12" />
                Open
              </button>
              <button type="button" class="api-link" @click="downloadAsset(selectedAsset)">
                <DownloadIcon :size="12" />
                Download
              </button>
              <MayaBtn
                variant="ghost"
                size="sm"
                intent="danger"
                @click="confirmDelete(selectedAsset)"
              >
                <Trash2Icon :size="14" />
                Delete
              </MayaBtn>
            </div>
          </div>

          <div class="detail-body">
            <!-- Preview tab -->
            <template v-if="rightTab === 'preview'">
              <div class="preview-frame">
                <img
                  v-if="isImage(selectedAsset.mimeType)"
                  :src="assetUrl(selectedAsset)"
                  :alt="selectedAsset.key"
                  class="preview-image"
                />
                <div v-else class="preview-placeholder">
                  <component :is="fileIcon(selectedAsset.mimeType)" :size="40" class="preview-icon" />
                  <span class="preview-mime">{{ selectedAsset.mimeType }}</span>
                </div>
              </div>

              <div class="meta-grid">
                <div class="meta-item">
                  <span class="meta-label">Path</span>
                  <code class="meta-value">{{ selectedAsset.key }}</code>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Size</span>
                  <span class="meta-value">{{ formatBytes(selectedAsset.size) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Type</span>
                  <span class="meta-value">{{ selectedAsset.mimeType }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Storage</span>
                  <span class="meta-value">{{ selectedAsset.destination }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">Uploaded</span>
                  <span class="meta-value">{{ formatTime(selectedAsset.createdAt) }}</span>
                </div>
                <div class="meta-item span-2">
                  <span class="meta-label">URL</span>
                  <code class="meta-value meta-url">{{ assetUrl(selectedAsset) }}</code>
                </div>
              </div>
            </template>

            <!-- API tab -->
            <template v-else>
              <section class="api-section">
                <h3 class="api-section-label">Serve this asset</h3>
                <div class="endpoint-row">
                  <MayaBadge variant="outline" size="sm">GET</MayaBadge>
                  <code class="endpoint-code">/api/cdn/assets/{{ selectedAsset.key }}</code>
                </div>
                <MayaCodeBlock
                  :code="selectedAsset.private ? curlProtected : curlPublic"
                  lang="bash"
                  :show-copy="true"
                />
              </section>

              <div class="api-divider" />

              <section class="api-section">
                <h3 class="api-section-label">Upload new asset</h3>
                <div class="endpoint-row">
                  <MayaBadge variant="outline" size="sm">POST</MayaBadge>
                  <code class="endpoint-code">/api/cdn/assets</code>
                  <MayaBadge variant="soft" size="sm">multipart</MayaBadge>
                </div>
                <p class="api-hint">
                  Fields: <code>file</code>, optional <code>path</code>, <code>access</code> (<code>public</code> or <code>api_key</code>).
                </p>
                <MayaCodeBlock :code="curlUpload" lang="bash" :show-copy="true" />
              </section>
            </template>
          </div>
        </div>
      </div>
    </div>

    <MayaAlertDialog
      v-model:open="isConfirmDeleteOpen"
      title="Delete asset"
      :description="`Remove “${assetToDelete?.key}” from the CDN? This deletes metadata and the Bucket0 file when possible.`"
    >
      <template #action>
        <MayaBtn intent="danger" :disabled="deleting" @click="handleDelete">
          <MayaSpinner v-if="deleting" class="delete-spinner" size="sm" />
          <span>{{ deleting ? 'Deleting…' : 'Yes, delete' }}</span>
        </MayaBtn>
      </template>
    </MayaAlertDialog>
  </ConsoleShell>
</template>

<style scoped>
.cdn-workspace {
  display: flex;
  height: calc(100vh - 52px);
  overflow: hidden;
  background-color: var(--maya-bg-root);
}

/* ── Left panel ── */
.list-panel {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--maya-border);
  background-color: var(--maya-bg-root);
}

.list-toolbar {
  display: flex;
  gap: 8px;
  height: 52px;
  padding: 0 12px;
  border-bottom: 1px dashed var(--maya-border);
  align-items: center;
}

.search-wrap {
  position: relative;
  flex: 1;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 14px;
  color: var(--maya-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 10px 0 32px;
  border-radius: var(--maya-radius-md);
  border: 1px solid var(--maya-border);
  background-color: var(--maya-bg-root);
  color: var(--maya-text-primary);
  font-size: 0.8125rem;
  font-family: var(--maya-font-sans);
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: var(--maya-text-muted);
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px dashed var(--maya-border);
}

.filter-pills {
  display: flex;
  flex: 1;
  background-color: var(--maya-bg-root);
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  padding: 2px;
}

.pill {
  flex: 1;
  border: none;
  background: transparent;
  padding: 5px 4px;
  border-radius: var(--maya-radius-sm);
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--maya-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: center;
  font-family: var(--maya-font-sans);
}

.pill:hover {
  color: var(--maya-text-primary);
}

.pill.active {
  background-color: var(--maya-bg-surface);
  color: var(--maya-text-primary);
  font-weight: 600;
}

.refresh-btn {
  border: none;
  background: transparent;
  color: var(--maya-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: var(--maya-radius-sm);
  transition: color 0.15s ease;
}

.refresh-btn:hover {
  color: var(--maya-text-primary);
}

.refresh-icon {
  width: 13px;
  height: 13px;
}

.refresh-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  100% { transform: rotate(360deg); }
}

.stats-strip {
  padding: 8px 14px;
  font-size: 0.625rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  color: var(--maya-text-muted);
  border-bottom: 1px dashed var(--maya-border);
}

.entries-scroll {
  flex: 1;
  overflow-y: auto;
}

.list-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 16px;
  color: var(--maya-text-muted);
  gap: 10px;
  font-size: 0.8125rem;
}

.empty-icon {
  width: 20px;
  height: 20px;
  opacity: 0.4;
}

.entries-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
}

.entry-item {
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: var(--maya-radius-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition:
    background var(--maya-duration) var(--maya-ease),
    color var(--maya-duration) var(--maya-ease);
  font-family: var(--maya-font-sans);
}

.entry-item:hover {
  background-color: color-mix(in srgb, var(--maya-bg-raised) 55%, transparent);
}

.entry-item.active {
  background-color: var(--maya-bg-raised);
}

.entry-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.entry-name {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--maya-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.entry-slug {
  font-family: var(--maya-font-mono);
  font-size: 0.6875rem;
  color: var(--maya-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.entry-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.625rem;
  color: var(--maya-text-muted);
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  text-transform: capitalize;
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--maya-warning);
}

.status-dot.live {
  background-color: var(--maya-success);
}

/* ── Right panel ── */
.detail-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px;
}

.detail-empty > * {
  max-width: 480px;
}

.detail-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 52px;
  padding: 0 20px;
  border-bottom: 1px dashed var(--maya-border);
  background-color: var(--maya-bg-root);
  gap: 12px;
  flex-shrink: 0;
}

.detail-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
}

.detail-title {
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--maya-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.detail-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.api-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--maya-text-muted);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: var(--maya-font-sans);
  transition: color 0.15s ease;
}

.api-link:hover {
  color: var(--maya-text-primary);
}

.tab-switcher {
  display: inline-flex;
  flex-shrink: 0;
  background-color: var(--maya-bg-root);
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  padding: 2px;
}

.file-input-hidden {
  position: absolute;
  width: 0;
  height: 0;
  opacity: 0;
  pointer-events: none;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  min-height: 140px;
  padding: 24px 16px;
  border: 1px dashed var(--maya-border);
  border-radius: var(--maya-radius-md);
  background: var(--maya-bg-root);
  cursor: pointer;
  font-family: var(--maya-font-sans);
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.drop-zone:hover:not(:disabled) {
  border-color: var(--maya-border-hover);
  background: color-mix(in srgb, var(--maya-bg-raised) 40%, transparent);
}

.drop-zone.has-file {
  border-style: solid;
  border-color: color-mix(in srgb, var(--maya-success) 35%, var(--maya-border));
}

.drop-zone:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.drop-zone-icon {
  color: var(--maya-text-muted);
}

.drop-zone-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--maya-text-primary);
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.drop-zone-hint {
  font-size: 0.6875rem;
  color: var(--maya-text-muted);
}

.tab-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  border: none;
  background: transparent;
  padding: 4px 12px;
  border-radius: var(--maya-radius-sm);
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--maya-text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--maya-font-sans);
}

.tab-btn.active {
  background-color: var(--maya-bg-surface);
  color: var(--maya-text-primary);
  font-weight: 600;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.upload-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--maya-text-secondary);
  line-height: 1.55;
}

.selected-file {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  background: var(--maya-bg-root);
  font-size: 0.8125rem;
  color: var(--maya-text-secondary);
}

.selected-file-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--maya-text-primary);
  font-weight: 500;
}

.selected-file-size {
  font-family: var(--maya-font-mono);
  font-size: 0.75rem;
  color: var(--maya-text-muted);
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.span-2 {
  grid-column: span 2;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--maya-text-muted);
}

.field-hint {
  font-family: var(--maya-font-mono);
  font-size: 0.6875rem;
  color: var(--maya-text-muted);
}

.access-control {
  display: flex;
  background-color: var(--maya-bg-root);
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  padding: 3px;
}

.access-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  background: transparent;
  border: none;
  border-radius: var(--maya-radius-sm);
  color: var(--maya-text-muted);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--maya-font-sans);
}

.access-option:hover {
  color: var(--maya-text-primary);
}

.access-option.active {
  background-color: var(--maya-bg-surface);
  color: var(--maya-text-primary);
  font-weight: 600;
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.upload-btn :deep(.upload-btn-spinner .maya-spinner-track) {
  stroke: color-mix(in srgb, var(--maya-btn-primary-text) 35%, transparent);
}

.upload-btn :deep(.upload-btn-spinner .maya-spinner-arc) {
  stroke: var(--maya-btn-primary-text);
}

.preview-frame {
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  background-color: var(--maya-bg-root);
  overflow: hidden;
  min-height: 200px;
  max-height: 320px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 320px;
  object-fit: contain;
  display: block;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 48px 24px;
}

.preview-icon {
  color: var(--maya-text-muted);
  opacity: 0.45;
}

.preview-mime {
  font-family: var(--maya-font-mono);
  font-size: 0.75rem;
  color: var(--maya-text-muted);
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 20px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item.span-2 {
  grid-column: span 2;
}

.meta-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--maya-text-muted);
}

.meta-value {
  font-size: 0.8125rem;
  color: var(--maya-text-primary);
  word-break: break-all;
}

.meta-value code,
code.meta-value {
  font-family: var(--maya-font-mono);
  font-size: 0.75rem;
}

.meta-url {
  display: block;
  padding: 10px 12px;
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  background: var(--maya-bg-root);
  line-height: 1.5;
}

.api-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.api-section-label {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--maya-text-muted);
}

.endpoint-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.endpoint-code {
  font-family: var(--maya-font-mono);
  font-size: 0.8125rem;
  color: var(--maya-text-primary);
}

.api-hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--maya-text-secondary);
  line-height: 1.5;
}

.api-hint code {
  font-family: var(--maya-font-mono);
  font-size: 0.75rem;
  color: var(--maya-text-primary);
}

.api-divider {
  height: 1px;
  background: repeating-linear-gradient(
    to right,
    var(--maya-border) 0,
    var(--maya-border) 4px,
    transparent 4px,
    transparent 8px
  );
}

.delete-spinner :deep(.maya-spinner-arc) {
  stroke: #fff;
}
</style>
