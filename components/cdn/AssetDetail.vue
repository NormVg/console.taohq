<template>
  <div class="h-full flex flex-col">
    <div class="action-bar">
      <div class="action-bar-left">
        <GeistBadge :variant="selectedAsset.access === 'public' ? 'success' : 'warning'" class="mr-2">
          {{ selectedAsset.access === 'public' ? 'public' : 'protected' }}
        </GeistBadge>
        <span class="action-bar-title" :title="selectedAsset.fileName">{{ selectedAsset.fileName }}</span>
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
          <span>{{ copied ? 'Copied' : 'Copy' }}</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { format } from 'date-fns'

const props = defineProps<{
  selectedAsset: any
}>()

const emit = defineEmits<{
  (e: 'deleted'): void
}>()

const activeTab = ref<'preview' | 'api'>('preview')
const imageLoading = ref(true)
const copied = ref(false)

watch(() => props.selectedAsset?.key, () => {
  imageLoading.value = true
})

const curlExample = computed(() => {
  if (!props.selectedAsset) return ''
  const url = props.selectedAsset.publicUrl || `${window.location.origin}/api/cdn/assets/${props.selectedAsset.key}`
  if (props.selectedAsset.access === 'api_key') {
    return `curl -H "Authorization: Bearer YOUR_API_KEY" \\\n  "${url}"`
  }
  return `curl -O "${url}"`
})

const htmlEmbed = computed(() => {
  if (!props.selectedAsset?.publicUrl) return ''
  return `<img src="${props.selectedAsset.publicUrl}" alt="${props.selectedAsset.fileName}" />`
})

function isImage(mime: string) {
  return mime?.startsWith('image/')
}

function getFileIcon(mime: string) {
  if (mime?.startsWith('image/')) return 'lucide:image'
  if (mime?.startsWith('video/')) return 'lucide:video'
  if (mime?.startsWith('audio/')) return 'lucide:music'
  if (mime === 'application/pdf') return 'lucide:file-text'
  if (mime?.startsWith('text/')) return 'lucide:file-type'
  if (mime?.includes('zip') || mime?.includes('tar') || mime?.includes('compressed')) return 'lucide:archive'
  return 'lucide:file'
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function formatDate(d: string | Date) {
  if (!d) return ''
  return format(new Date(d), 'dd MMM, hh:mm a')
}

async function copyUrl() {
  if (!props.selectedAsset?.publicUrl) return
  try {
    await navigator.clipboard.writeText(props.selectedAsset.publicUrl)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (err) {
    console.error('Failed to copy: ', err)
  }
}

function openUrl(url: string) {
  window.open(url, '_blank')
}

function downloadAsset() {
  if (!props.selectedAsset?.publicUrl) return
  const a = document.createElement('a')
  a.href = props.selectedAsset.publicUrl
  a.download = props.selectedAsset.fileName || 'download'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function deleteAsset() {
  if (!props.selectedAsset) return
  if (!confirm(`Delete asset: ${props.selectedAsset.key}?`)) return
  try {
    await $fetch(`/api/cdn/assets/${encodeURIComponent(props.selectedAsset.key)}`, { method: 'DELETE' })
    emit('deleted')
  } catch (e: any) {
    alert(e.data?.statusMessage || e.data?.error || 'Failed to delete asset')
  }
}
</script>

<style scoped>
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-surface);
}

.action-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
}

.action-bar-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.tab-toggle {
  display: flex;
  background: var(--bg-surface-2);
  padding: 3px;
  border-radius: 6px;
  border: 1px solid var(--border-default);
  gap: 2px;
}

.tab-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 150ms ease;
}

.tab-btn:hover {
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px var(--border-default);
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.preview-section {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 240px;
  background: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  margin-bottom: 24px;
  overflow: hidden;
  position: relative;
}

.preview-image-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.preview-image {
  max-width: 100%;
  max-height: 400px;
  object-fit: contain;
}

.preview-file-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
}

.metadata-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metadata-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metadata-value {
  font-size: 14px;
  color: var(--text-primary);
}

.url-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--border-default);
}

.api-docs {
  display: flex;
  flex-direction: column;
  gap: 32px;
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
  margin: 0;
}

.api-description {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 4px 0;
}
</style>
