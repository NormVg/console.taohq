<template>
  <div class="h-full flex flex-col">
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
          <GeistButton variant="secondary" size="sm" @click="$emit('cancel')">Cancel</GeistButton>
          <GeistButton size="sm" :loading="uploading" :disabled="!selectedFile" @click="uploadFile">Upload</GeistButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  currentFolderId: string | null
}>()

const emit = defineEmits<{
  (e: 'cancel'): void
  (e: 'uploaded', newKey: string | null): void
}>()

const fileInputRef = ref<HTMLInputElement | null>(null)
const isDragOver = ref(false)
const selectedFile = ref<File | null>(null)
const uploadAccess = ref<'public' | 'api_key'>('public')
const uploading = ref(false)

function getFileIcon(mime: string) {
  if (mime.startsWith('image/')) return 'lucide:image'
  if (mime.startsWith('video/')) return 'lucide:video'
  if (mime.startsWith('audio/')) return 'lucide:music'
  if (mime === 'application/pdf') return 'lucide:file-text'
  if (mime.startsWith('text/')) return 'lucide:file-type'
  if (mime.includes('zip') || mime.includes('tar') || mime.includes('compressed')) return 'lucide:archive'
  return 'lucide:file'
}

function formatBytes(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
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
  formData.append('access', uploadAccess.value)
  if (props.currentFolderId) {
    formData.append('folderId', props.currentFolderId)
  }

  try {
    const result = await $fetch<any>('/api/cdn/assets', {
      method: 'POST',
      body: formData,
    })
    selectedFile.value = null
    uploadAccess.value = 'public'
    if (fileInputRef.value) fileInputRef.value.value = ''
    emit('uploaded', result?.key || null)
  } catch (err: any) {
    alert(err.data?.statusMessage || err.data?.error || 'Upload failed')
  } finally {
    uploading.value = false
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
}

.action-bar-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.upload-zone-wrapper {
  max-width: 400px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.upload-zone {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  border: 2px dashed var(--border-default);
  border-radius: 8px;
  background: var(--bg-root);
  transition: all 150ms ease;
  overflow: hidden;
}

.upload-zone:hover,
.upload-zone--hover {
  border-color: var(--text-secondary);
  background: var(--bg-surface-2);
}

.upload-zone-input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  z-index: 10;
}

.selected-file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
}

.access-select {
  width: 100%;
  padding: 8px 12px;
  border-radius: 6px;
  border: 1px solid var(--border-default);
  background: var(--bg-surface);
  color: var(--text-primary);
  font-size: 14px;
  outline: none;
  transition: border-color 150ms ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px;
}

.access-select:focus {
  border-color: var(--text-secondary);
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 12px;
  border-top: 1px solid var(--border-default);
  padding-top: 20px;
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
</style>
