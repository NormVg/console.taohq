<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
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
  BookOpenIcon,
  ShieldIcon,
} from 'lucide-vue-next'

const apiKeysStore = useApiKeysStore()
const { toast } = useToast()

const isCreateDialogOpen = ref(false)
const keyName = ref('')
const generatedKey = ref<string | null>(null)
const justCopied = ref(false)
const creating = ref(false)
const revoking = ref(false)

const keyToRevoke = ref<{ id: string; name: string } | null>(null)
const isConfirmDialogOpen = ref(false)

const responseFields = [
  { key: 'slug', type: 'string' },
  { key: 'title', type: 'string' },
  { key: 'type', type: 'text | markdown | json' },
  { key: 'body', type: 'string' },
  { key: 'publishedAt', type: 'ISO 8601 timestamp' },
]

onMounted(async () => {
  await apiKeysStore.fetchKeys()
})

const totalKeys = computed(() => apiKeysStore.keys.length)
const usedKeys = computed(() => apiKeysStore.keys.filter(k => k.lastUsedAt).length)
const unusedKeys = computed(() => totalKeys.value - usedKeys.value)

const baseUrl = computed(() =>
  typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'
)

const curlExample = computed(
  () =>
    `curl -X GET '${baseUrl.value}/api/content/your-slug' \\\n  -H 'Authorization: Bearer YOUR_API_KEY'`
)

const openCreateDialog = () => {
  keyName.value = ''
  generatedKey.value = null
  justCopied.value = false
  isCreateDialogOpen.value = true
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
  } catch (err: any) {
    toast({ title: 'Error', description: err.message || 'Failed to create API key.', intent: 'danger' })
  } finally {
    creating.value = false
  }
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

const confirmRevoke = (key: { id: string; name: string }) => {
  keyToRevoke.value = key
  isConfirmDialogOpen.value = true
}

const handleRevokeKey = async () => {
  if (!keyToRevoke.value) return
  revoking.value = true
  try {
    await apiKeysStore.revokeKey(keyToRevoke.value.id)
    toast({ title: 'Revoked', description: `"${keyToRevoke.value.name}" has been revoked.`, intent: 'info' })
    isConfirmDialogOpen.value = false
    keyToRevoke.value = null
  } catch (err: any) {
    toast({ title: 'Error', description: err.message || 'Failed to revoke API key.', intent: 'danger' })
  } finally {
    revoking.value = false
  }
}

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

const formatTime = (dateStr: string | null) => {
  if (!dateStr) return null
  return new Date(dateStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <ConsoleShell page-title="API Keys">
    <div class="keys-workspace">
      <div class="keys-container">

        <!-- Hero -->
        <header class="page-header">
          <div class="page-header-text">
            <h1 class="page-title">API Keys</h1>
            <p class="page-subtitle">
              Manage access tokens for reading published CMS content from apps, scripts, and services.
            </p>
          </div>
          <MayaBtn size="sm" @click="openCreateDialog">
            <PlusIcon :size="15" />
            <span>New API Key</span>
          </MayaBtn>
        </header>

        <!-- Stats -->
        <div class="stats-grid">
          <MayaCard class="stat-card">
            <div class="stat-inner">
              <div class="stat-icon-wrap">
                <KeyIcon :size="18" class="stat-icon" />
              </div>
              <div class="stat-copy">
                <span class="stat-label">Total keys</span>
                <span class="stat-value">{{ totalKeys }}</span>
              </div>
            </div>
          </MayaCard>
          <MayaCard class="stat-card">
            <div class="stat-inner">
              <div class="stat-icon-wrap stat-icon-wrap--success">
                <ClockIcon :size="18" class="stat-icon stat-icon--success" />
              </div>
              <div class="stat-copy">
                <span class="stat-label">Used at least once</span>
                <span class="stat-value">{{ usedKeys }}</span>
              </div>
            </div>
          </MayaCard>
          <MayaCard class="stat-card">
            <div class="stat-inner">
              <div class="stat-icon-wrap stat-icon-wrap--muted">
                <ShieldIcon :size="18" class="stat-icon stat-icon--muted" />
              </div>
              <div class="stat-copy">
                <span class="stat-label">Never used</span>
                <span class="stat-value">{{ unusedKeys }}</span>
              </div>
            </div>
          </MayaCard>
        </div>

        <!-- Keys list -->
        <MayaCard class="keys-card">
          <template #header>
            <div class="keys-card-header">
              <div>
                <h2 class="section-title">Your keys</h2>
                <p class="section-desc">Revoke any key you no longer trust. Prefixes are safe to display.</p>
              </div>
              <MayaBtn
                variant="ghost"
                size="icon"
                title="Refresh list"
                :disabled="apiKeysStore.loading"
                @click="handleRefresh"
              >
                <RefreshCwIcon :size="16" :class="{ spinning: apiKeysStore.loading }" />
              </MayaBtn>
            </div>
          </template>

          <div v-if="apiKeysStore.loading && apiKeysStore.keys.length === 0" class="state-box">
            <MayaSpinner size="lg" />
            <span class="state-text">Loading API keys...</span>
          </div>

          <MayaEmptyState
            v-else-if="apiKeysStore.keys.length === 0"
            :icon="KeyIcon"
            title="No API keys yet"
            description="Create a key to start querying your published content from external apps or services."
          >
            <template #action>
              <MayaBtn size="sm" @click="openCreateDialog">
                <PlusIcon :size="14" />
                <span>Create your first key</span>
              </MayaBtn>
            </template>
          </MayaEmptyState>

          <div v-else class="table-wrap">
            <table class="keys-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Prefix</th>
                  <th>Created</th>
                  <th>Last used</th>
                  <th class="th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="key in apiKeysStore.keys" :key="key.id" class="table-row">
                  <td>
                    <span class="key-name">{{ key.name }}</span>
                  </td>
                  <td>
                    <button type="button" class="prefix-chip" title="Copy prefix" @click="copyPrefix(key.prefix)">
                      <code class="prefix-text">{{ key.prefix }}…</code>
                      <CopyIcon :size="11" class="prefix-copy-icon" />
                    </button>
                  </td>
                  <td>
                    <div class="ts-cell">
                      <CalendarIcon :size="12" class="ts-icon" />
                      <div class="ts-lines">
                        <span class="ts-date">{{ formatDate(key.createdAt) }}</span>
                        <span class="ts-time">{{ formatTime(key.createdAt) }}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div v-if="key.lastUsedAt" class="ts-cell">
                      <ClockIcon :size="12" class="ts-icon ts-icon--used" />
                      <div class="ts-lines">
                        <span class="ts-date">{{ formatDate(key.lastUsedAt) }}</span>
                        <span class="ts-time">{{ formatTime(key.lastUsedAt) }}</span>
                      </div>
                    </div>
                    <MayaBadge v-else variant="soft" size="sm">Never used</MayaBadge>
                  </td>
                  <td class="td-right">
                    <MayaBtn variant="ghost" intent="danger" size="sm" @click="confirmRevoke(key)">
                      <Trash2Icon :size="13" />
                      <span>Revoke</span>
                    </MayaBtn>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </MayaCard>

        <!-- API docs -->
        <MayaCard class="docs-card">
          <template #header>
            <div class="docs-card-header">
              <BookOpenIcon :size="18" class="docs-header-icon" />
              <div>
                <h2 class="section-title">API reference</h2>
                <p class="section-desc">Read published content with a bearer token.</p>
              </div>
            </div>
          </template>

          <div class="docs-body">
            <section class="docs-block">
              <h3 class="docs-label">Endpoint</h3>
              <div class="endpoint-pill">
                <MayaBadge variant="outline" size="sm">GET</MayaBadge>
                <code class="endpoint-path">/api/content/<span class="endpoint-param">:slug</span></code>
              </div>
            </section>

            <div class="docs-divider" />

            <section class="docs-block">
              <h3 class="docs-label">Authentication</h3>
              <div class="auth-line">
                <code>Authorization: Bearer </code>
                <span class="auth-token">YOUR_API_KEY</span>
              </div>
            </section>

            <div class="docs-divider" />

            <section class="docs-block">
              <h3 class="docs-label">Example request</h3>
              <MayaCodeBlock :code="curlExample" lang="bash" :show-copy="true" />
            </section>

            <div class="docs-divider" />

            <section class="docs-block">
              <h3 class="docs-label">Response fields</h3>
              <ul class="fields-list">
                <li v-for="f in responseFields" :key="f.key" class="fields-row">
                  <code class="field-name">{{ f.key }}</code>
                  <span class="field-type">{{ f.type }}</span>
                </li>
              </ul>
            </section>
          </div>
        </MayaCard>

      </div>
    </div>

    <!-- Create dialog -->
    <MayaDialog v-model="isCreateDialogOpen">
      <div v-if="!generatedKey" class="dialog-panel">
        <h2 class="dialog-title">Create API key</h2>
        <p class="dialog-desc">
          Give your key a descriptive label so you can identify it later (e.g. “Production frontend”).
        </p>

        <MayaInput
          v-model="keyName"
          label="Key name"
          placeholder="e.g. Production Frontend"
          @keyup.enter="handleCreateKey"
        />

        <div class="dialog-actions">
          <MayaBtn variant="outline" :disabled="creating" @click="isCreateDialogOpen = false">Cancel</MayaBtn>
          <MayaBtn class="dialog-primary-btn" :disabled="creating" @click="handleCreateKey">
            <MayaSpinner v-if="creating" class="dialog-btn-spinner" size="sm" />
            <span>{{ creating ? 'Generating…' : 'Generate key' }}</span>
          </MayaBtn>
        </div>
      </div>

      <div v-else class="dialog-panel">
        <MayaAlert intent="warning" title="Copy this key now" :icon="AlertTriangleIcon">
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

        <MayaBtn style="width: 100%; justify-content: center;" @click="isCreateDialogOpen = false">
          I've saved this key safely
        </MayaBtn>
      </div>
    </MayaDialog>

    <!-- Revoke confirm -->
    <MayaAlertDialog
      v-model:open="isConfirmDialogOpen"
      title="Revoke API key"
      :description="`Revoking “${keyToRevoke?.name}” is permanent. Clients using this key will get 401 errors immediately.`"
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
.keys-workspace {
  display: flex;
  justify-content: center;
  min-height: calc(100vh - 52px);
  background-color: var(--maya-bg-root);
  padding: 48px 32px 64px;
  overflow-y: auto;
}

.keys-container {
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--maya-text-primary);
  margin: 0 0 6px;
  letter-spacing: -0.03em;
  line-height: 1.2;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--maya-text-secondary);
  margin: 0;
  line-height: 1.55;
  max-width: 36rem;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-card :deep(.maya-card-body) {
  padding: 14px 16px;
}

.stat-inner {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--maya-radius-md);
  background: var(--maya-bg-root);
  border: 1px solid var(--maya-border);
  flex-shrink: 0;
}

.stat-icon-wrap--success {
  background: color-mix(in srgb, var(--maya-success) 10%, transparent);
  border-color: color-mix(in srgb, var(--maya-success) 30%, transparent);
}

.stat-icon-wrap--muted {
  background: var(--maya-bg-root);
}

.stat-icon {
  color: var(--maya-text-primary);
}

.stat-icon--success {
  color: var(--maya-success);
}

.stat-icon--muted {
  color: var(--maya-text-muted);
}

.stat-copy {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.stat-label {
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--maya-text-muted);
}

.stat-value {
  font-size: 1.375rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--maya-text-primary);
  line-height: 1.1;
}

/* Section typography */
.section-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--maya-text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.section-desc {
  font-size: 0.8125rem;
  color: var(--maya-text-secondary);
  margin: 4px 0 0;
  line-height: 1.45;
}

.keys-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}

.spinning {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Table inside card — flush with card body */
.keys-card :deep(.maya-card-body) {
  padding: 0;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
}

.keys-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.8125rem;
}

.keys-table th {
  padding: 10px 20px;
  text-align: left;
  font-size: 0.6875rem;
  font-weight: 600;
  color: var(--maya-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-bottom: 1px dashed var(--maya-border);
  white-space: nowrap;
}

.th-right {
  text-align: right;
}

.keys-table td {
  padding: 14px 20px;
  border-bottom: 1px solid color-mix(in srgb, var(--maya-border) 45%, transparent);
  color: var(--maya-text-primary);
  vertical-align: middle;
}

.td-right {
  text-align: right;
}

.td-right > * {
  margin-left: auto;
}

.table-row:last-child td {
  border-bottom: none;
}

.table-row:hover td {
  background: color-mix(in srgb, var(--maya-bg-raised) 50%, transparent);
}

.key-name {
  font-weight: 600;
  letter-spacing: -0.01em;
}

.prefix-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: var(--maya-bg-root);
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  cursor: pointer;
  font-family: inherit;
  transition:
    border-color var(--maya-duration) var(--maya-ease),
    background var(--maya-duration) var(--maya-ease);
}

.prefix-chip:hover {
  border-color: var(--maya-border-hover);
  background: var(--maya-bg-raised);
}

.prefix-text {
  font-family: var(--maya-font-mono);
  font-size: 0.75rem;
  color: var(--maya-text-secondary);
}

.prefix-copy-icon {
  color: var(--maya-text-muted);
  flex-shrink: 0;
}

.ts-cell {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ts-icon {
  color: var(--maya-text-muted);
  flex-shrink: 0;
}

.ts-icon--used {
  color: var(--maya-success);
}

.ts-lines {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.ts-date {
  font-size: 0.8125rem;
  color: var(--maya-text-primary);
  line-height: 1.2;
}

.ts-time {
  font-size: 0.6875rem;
  color: var(--maya-text-muted);
  line-height: 1.2;
}

.state-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 32px;
  gap: 12px;
}

.state-text {
  font-size: 0.875rem;
  color: var(--maya-text-secondary);
}

/* API docs card */
.docs-card-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.docs-header-icon {
  color: var(--maya-text-secondary);
  flex-shrink: 0;
  margin-top: 2px;
}

.docs-body {
  display: flex;
  flex-direction: column;
}

.docs-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.docs-label {
  margin: 0;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--maya-text-muted);
}

.docs-divider {
  height: 1px;
  margin: 24px 0;
  background: repeating-linear-gradient(
    to right,
    var(--maya-border) 0,
    var(--maya-border) 4px,
    transparent 4px,
    transparent 8px
  );
}

.endpoint-pill {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.endpoint-path {
  font-family: var(--maya-font-mono);
  font-size: 0.9375rem;
  color: var(--maya-text-primary);
}

.endpoint-param {
  color: var(--maya-info);
}

.auth-line {
  padding: 14px 16px;
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  background: var(--maya-bg-root);
  font-family: var(--maya-font-mono);
  font-size: 0.875rem;
  color: var(--maya-text-secondary);
  line-height: 1.6;
}

.auth-token {
  color: var(--maya-warning);
  font-weight: 500;
}

.fields-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  overflow: hidden;
}

.fields-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 16px;
  border-bottom: 1px solid color-mix(in srgb, var(--maya-border) 45%, transparent);
}

.fields-row:last-child {
  border-bottom: none;
}

.field-name {
  font-family: var(--maya-font-mono);
  font-size: 0.8125rem;
  color: var(--maya-text-primary);
}

.field-type {
  font-family: var(--maya-font-mono);
  font-size: 0.75rem;
  color: var(--maya-text-muted);
  text-align: right;
}

/* Dialog */
.dialog-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 420px;
}

.dialog-title {
  font-size: 1.125rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0;
  color: var(--maya-text-primary);
}

.dialog-desc {
  font-size: 0.8125rem;
  color: var(--maya-text-secondary);
  margin: -12px 0 0;
  line-height: 1.55;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.dialog-primary-btn :deep(.dialog-btn-spinner .maya-spinner-arc) {
  stroke: var(--maya-btn-primary-text);
}

.dialog-primary-btn :deep(.dialog-btn-spinner .maya-spinner-track) {
  stroke: color-mix(in srgb, var(--maya-btn-primary-text) 35%, transparent);
}

.dialog-btn-spinner--danger :deep(.maya-spinner-arc) {
  stroke: #fff;
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

@media (max-width: 720px) {
  .keys-workspace {
    padding: 32px 16px 48px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .page-header .maya-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
