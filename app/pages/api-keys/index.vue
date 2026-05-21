<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useApiKeysStore } from '../../stores/apiKeys'
import {
  KeyIcon,
  PlusIcon,
  Trash2Icon,
  CopyIcon,
  CheckIcon,
  ClockIcon,
  CalendarIcon,
  AlertTriangleIcon,
  RefreshCwIcon,
  ShieldIcon,
  SearchIcon
} from 'lucide-vue-next'

const apiKeysStore = useApiKeysStore()
const { toast } = useToast()

const searchQuery = ref('')
const selectedKeyId = ref<string | null>(null)
const isCreating = ref(false)

const keyName = ref('')
const generatedKey = ref<string | null>(null)
const justCopied = ref(false)
const creating = ref(false)

const isConfirmRevokeOpen = ref(false)
const revoking = ref(false)

onMounted(async () => {
  await apiKeysStore.fetchKeys()
  if (apiKeysStore.keys.length > 0) {
    selectedKeyId.value = apiKeysStore.keys[0].id
  }
})

const filteredKeys = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  return apiKeysStore.keys.filter(key => 
    !q || 
    key.name.toLowerCase().includes(q) || 
    key.prefix.toLowerCase().includes(q)
  )
})

const selectedKey = computed(() => 
  apiKeysStore.keys.find(k => k.id === selectedKeyId.value) || null
)

watch(() => apiKeysStore.keys, (keys) => {
  if (isCreating.value) return
  if (!keys.length) {
    selectedKeyId.value = null
    return
  }
  if (!selectedKeyId.value || !keys.find(k => k.id === selectedKeyId.value)) {
    selectedKeyId.value = keys[0].id
  }
}, { deep: true })

const startCreate = () => {
  isCreating.value = true
  selectedKeyId.value = null
  keyName.value = ''
  generatedKey.value = null
  justCopied.value = false
}

const selectKey = (id: string) => {
  selectedKeyId.value = id
  isCreating.value = false
}

const handleRefresh = async () => {
  await apiKeysStore.fetchKeys()
  toast({ title: 'Refreshed', description: 'API keys list updated.', intent: 'success', duration: 1500 })
}

const handleCreateKey = async () => {
  if (!keyName.value.trim()) {
    toast({ title: 'Validation Error', description: 'Please provide a name for the API key.', intent: 'danger' })
    return
  }
  creating.value = true
  try {
    const res = await apiKeysStore.createKey(keyName.value.trim())
    generatedKey.value = res.fullKey
    toast({ title: 'Created', description: 'API key generated successfully.', intent: 'success' })
    // Refresh to get the new key in the list
    await apiKeysStore.fetchKeys()
    const newKey = apiKeysStore.keys.find(k => k.name === keyName.value.trim() && !k.revoked)
    if (newKey) selectedKeyId.value = newKey.id
  } catch (err: any) {
    toast({ title: 'Error', description: err.message || 'Failed to create API key.', intent: 'danger' })
  } finally {
    creating.value = false
  }
}

const finishCreate = () => {
  isCreating.value = false
  generatedKey.value = null
}

const copyGeneratedKey = async () => {
  if (!generatedKey.value) return
  try {
    await navigator.clipboard.writeText(generatedKey.value)
    justCopied.value = true
    toast({ title: 'Copied', description: 'API key copied to clipboard.', intent: 'success', duration: 2000 })
    setTimeout(() => { justCopied.value = false }, 2000)
  } catch {
    toast({ title: 'Failed to copy', description: 'Could not copy to clipboard.', intent: 'danger' })
  }
}

const copyPrefix = async (prefix: string) => {
  try {
    await navigator.clipboard.writeText(prefix)
    toast({ title: 'Copied', description: 'Key prefix copied to clipboard.', intent: 'success', duration: 1500 })
  } catch {
    toast({ title: 'Failed to copy', description: 'Could not copy prefix.', intent: 'danger' })
  }
}

const handleRevokeKey = async () => {
  if (!selectedKey.value) return
  revoking.value = true
  try {
    await apiKeysStore.revokeKey(selectedKey.value.id)
    toast({ title: 'Revoked', description: `"${selectedKey.value.name}" has been revoked.`, intent: 'info' })
    isConfirmRevokeOpen.value = false
    selectedKeyId.value = null
  } catch (err: any) {
    toast({ title: 'Error', description: err.message || 'Failed to revoke API key.', intent: 'danger' })
  } finally {
    revoking.value = false
  }
}

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return 'Never'
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <ConsoleShell page-title="API Keys">
    <div class="api-workspace">
      <!-- LEFT: Key list -->
      <div class="list-panel">
        <div class="list-toolbar">
          <div class="search-wrap">
            <SearchIcon class="search-icon" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search keys..."
              class="search-input"
            />
          </div>
          <MayaBtn size="icon" variant="outline" title="New API Key" @click="startCreate">
            <PlusIcon :size="16" />
          </MayaBtn>
        </div>

        <div class="filter-bar" style="justify-content: flex-end;">
          <button class="refresh-btn" title="Refresh" @click="handleRefresh">
            <RefreshCwIcon class="refresh-icon" :class="{ spinning: apiKeysStore.loading }" />
          </button>
        </div>

        <div v-if="apiKeysStore.keys.length > 0" class="stats-strip">
          {{ apiKeysStore.keys.length }} active key{{ apiKeysStore.keys.length === 1 ? '' : 's' }}
        </div>

        <div class="entries-scroll">
          <div v-if="apiKeysStore.loading && apiKeysStore.keys.length === 0" class="list-empty">
            <MayaSpinner size="md" />
            <span>Loading...</span>
          </div>

          <div v-else-if="apiKeysStore.keys.length === 0" class="list-empty">
            <KeyIcon class="empty-icon" />
            <span>No API keys</span>
            <MayaBtn size="sm" variant="outline" @click="startCreate">
              <PlusIcon :size="13" />
              Create one
            </MayaBtn>
          </div>

          <div v-else-if="filteredKeys.length === 0" class="list-empty">
            <SearchIcon class="empty-icon" />
            <span>No matches</span>
          </div>

          <div v-else class="entries-list">
            <button
              v-for="key in filteredKeys"
              :key="key.id"
              type="button"
              class="entry-item"
              :class="{ active: selectedKeyId === key.id && !isCreating }"
              @click="selectKey(key.id)"
            >
              <div class="entry-top">
                <span class="entry-name">{{ key.name }}</span>
                <span class="entry-slug">{{ key.prefix }}…</span>
              </div>
              <div class="entry-meta">
                <span>Created {{ formatTime(key.createdAt).split(',')[0] }}</span>
                <div class="status-indicator">
                  <div class="status-dot" :class="{ live: key.lastUsedAt }"></div>
                  <span>{{ key.lastUsedAt ? 'Active' : 'Unused' }}</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT: Detail / Create -->
      <div class="detail-panel">
        
        <!-- Empty -->
        <div v-if="!selectedKey && !isCreating" class="detail-empty">
          <MayaEmptyState
            :icon="KeyIcon"
            title="No API key selected"
            description="Select an API key from the list or create a new one to securely access your content."
          >
            <template #action>
              <MayaBtn @click="startCreate">
                <PlusIcon :size="14" />
                New API Key
              </MayaBtn>
            </template>
          </MayaEmptyState>
        </div>

        <!-- Create workspace -->
        <div v-else-if="isCreating" class="detail-workspace">
          <div class="detail-header">
            <div class="detail-header-left">
              <MayaBadge size="sm" variant="muted" intent="success">New</MayaBadge>
              <span class="detail-title">Create API Key</span>
            </div>
          </div>

          <div class="detail-body">
            <div v-if="!generatedKey" class="form-container" style="max-width: 480px;">
              <p class="create-hint" style="margin-top: 0; color: var(--maya-text-secondary); font-size: 0.8125rem; line-height: 1.5;">
                Give your key a descriptive label so you can identify it later (e.g. “Production frontend”).
              </p>

              <div class="field" style="margin-top: 24px;">
                <label class="field-label">Key name</label>
                <MayaInput
                  v-model="keyName"
                  placeholder="e.g. Production Frontend"
                  @keyup.enter="handleCreateKey"
                />
              </div>

              <div class="upload-actions" style="margin-top: 24px;">
                <MayaBtn variant="outline" :disabled="creating" @click="isCreating = false">
                  Cancel
                </MayaBtn>
                <MayaBtn
                  class="upload-btn"
                  :disabled="creating || !keyName.trim()"
                  @click="handleCreateKey"
                >
                  <MayaSpinner v-if="creating" class="upload-btn-spinner" size="sm" />
                  <KeyIcon v-else :size="14" />
                  {{ creating ? 'Generating…' : 'Generate Key' }}
                </MayaBtn>
              </div>
            </div>

            <div v-else class="form-container" style="max-width: 520px;">
              <MayaAlert intent="warning" title="Copy this key now" :icon="AlertTriangleIcon" style="margin-bottom: 24px;">
                It will <strong>never be shown again</strong>. If you lose it, generate a new one.
              </MayaAlert>

              <div class="reveal-field">
                <span class="reveal-label">Your API key</span>
                <div class="key-reveal-box">
                  <code class="key-reveal-text">{{ generatedKey }}</code>
                  <MayaBtn
                    variant="outline"
                    size="icon"
                    class="key-copy-btn"
                    :class="{ copied: justCopied }"
                    title="Copy key"
                    @click="copyGeneratedKey"
                  >
                    <CheckIcon v-if="justCopied" :size="15" />
                    <CopyIcon v-else :size="15" />
                  </MayaBtn>
                </div>
              </div>

              <div class="upload-actions" style="margin-top: 32px;">
                <MayaBtn style="width: 100%; justify-content: center;" @click="finishCreate">
                  I've saved this key safely
                </MayaBtn>
              </div>
            </div>
          </div>
        </div>

        <!-- Detail workspace -->
        <div v-else-if="selectedKey" class="detail-workspace">
          <div class="detail-header">
            <div class="detail-header-left">
              <span class="detail-title">{{ selectedKey.name }}</span>
            </div>
            
            <div class="detail-header-right">
              <MayaBtn
                variant="ghost"
                size="sm"
                intent="danger"
                @click="isConfirmRevokeOpen = true"
              >
                <Trash2Icon :size="14" />
                Revoke Key
              </MayaBtn>
            </div>
          </div>

          <div class="detail-body">
            <div class="meta-grid">
              <div class="meta-item">
                <span class="meta-label">Name</span>
                <span class="meta-value" style="font-weight: 500;">{{ selectedKey.name }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Prefix</span>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <code class="meta-value">{{ selectedKey.prefix }}…</code>
                  <button type="button" class="api-link" style="padding: 0; background: none; border: none; cursor: pointer;" title="Copy prefix" @click="copyPrefix(selectedKey.prefix)">
                    <CopyIcon :size="12" />
                  </button>
                </div>
              </div>
              <div class="meta-item">
                <span class="meta-label">Created</span>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--maya-text-primary);">
                  <CalendarIcon :size="14" style="color: var(--maya-text-muted);" />
                  <span>{{ formatTime(selectedKey.createdAt) }}</span>
                </div>
              </div>
              <div class="meta-item">
                <span class="meta-label">Last Used</span>
                <div style="display: flex; align-items: center; gap: 6px; font-size: 0.8125rem; color: var(--maya-text-primary);">
                  <ClockIcon :size="14" :style="{ color: selectedKey.lastUsedAt ? 'var(--maya-success)' : 'var(--maya-text-muted)' }" />
                  <span>{{ formatTime(selectedKey.lastUsedAt) }}</span>
                </div>
              </div>
            </div>

            <div class="api-divider" style="margin: 32px 0;"></div>

            <section class="api-section">
              <h3 class="api-section-label">Security & Access</h3>
              <p style="font-size: 0.8125rem; color: var(--maya-text-secondary); line-height: 1.6; max-width: 600px;">
                This API key grants read-only access to all published content and protected CDN assets. 
                Keep it secure and never expose it in client-side code unless explicitly intended for public consumption.
                If compromised, revoke it immediately.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>

    <!-- Revoke confirm -->
    <MayaAlertDialog
      v-model:open="isConfirmRevokeOpen"
      title="Revoke API key"
      :description="`Revoking “${selectedKey?.name}” is permanent. Clients using this key will get 401 errors immediately.`"
    >
      <template #action>
        <MayaBtn intent="danger" :disabled="revoking" @click="handleRevokeKey">
          <MayaSpinner v-if="revoking" class="dialog-btn-spinner dialog-btn-spinner--danger" size="sm" />
          <span>{{ revoking ? 'Revoking…' : 'Yes, revoke key' }}</span>
        </MayaBtn>
      </template>
    </MayaAlertDialog>
  </ConsoleShell>
</template>

<style scoped>
.api-workspace {
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
}

.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--maya-border);
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

.detail-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--maya-text-muted);
}

.upload-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.upload-btn :deep(.upload-btn-spinner .maya-spinner-track) {
  stroke: color-mix(in srgb, var(--maya-btn-primary-text) 35%, transparent);
}

.upload-btn :deep(.upload-btn-spinner .maya-spinner-arc) {
  stroke: var(--maya-btn-primary-text);
}

.reveal-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reveal-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--maya-text-muted);
}

.key-reveal-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  background: var(--maya-bg-root);
}

.key-reveal-text {
  flex: 1;
  font-family: var(--maya-font-mono);
  font-size: 0.8125rem;
  color: var(--maya-text-primary);
  word-break: break-all;
  line-height: 1.5;
  user-select: all;
}

.key-copy-btn.copied {
  background: var(--maya-success) !important;
  border-color: var(--maya-success) !important;
  color: #fff !important;
}

.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
}

code.meta-value {
  font-family: var(--maya-font-mono);
  font-size: 0.75rem;
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

.api-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.api-section-label {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--maya-text-muted);
}

.dialog-btn-spinner--danger :deep(.maya-spinner-arc) {
  stroke: #fff;
}
</style>
