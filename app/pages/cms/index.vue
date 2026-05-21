<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useCmsStore } from '../../stores/cms'
import {
  PlusIcon,
  SearchIcon,
  LayersIcon,
  FileTextIcon,
  CodeIcon,
  Trash2Icon,
  SaveIcon,
  ExternalLinkIcon,
  FileCodeIcon,
  RefreshCwIcon,
  BookOpenIcon,
  CopyIcon,
} from 'lucide-vue-next'

const cmsStore = useCmsStore()
const { toast } = useToast()

// Local UI state
const searchQuery = ref('')
const selectedTypeFilter = ref('all')
const selectedEntryId = ref<string | null>(null)
const isCreating = ref(false)
const saving = ref(false)

// Form state for creating / editing
const form = ref({
  title: '',
  slug: '',
  type: 'text' as 'text' | 'markdown' | 'json',
  body: '',
  published: true
})

const rightTab = ref<'edit' | 'api'>('edit')

const baseUrl = computed(() =>
  typeof window !== 'undefined' ? window.location.origin : ''
)

const curlExample = computed(
  () =>
    `curl -X GET '${baseUrl.value}/api/content/${form.value.slug || 'your-slug'}' \\\n  -H 'Authorization: Bearer YOUR_API_KEY'`
)

const responseFields = [
  { key: 'slug', type: 'string' },
  { key: 'title', type: 'string' },
  { key: 'type', type: 'text | markdown | json' },
  { key: 'body', type: 'string' },
  { key: 'publishedAt', type: 'ISO 8601 timestamp' },
]

// Dynamic placeholder text helper based on active type
const placeholderText = computed(() => {
  if (form.value.type === 'json') {
    return '{\n  "name": "taohq CMS",\n  "status": "online",\n  "version": "1.0.0"\n}'
  }
  if (form.value.type === 'markdown') {
    return '# New Document\n\nStart writing rich content here...'
  }
  return 'Type plain text document body here...'
})

// Markdown preview active tab
const activeTab = ref<'edit' | 'preview'>('edit')

// JSON Validation State
const jsonError = ref<string | null>(null)

// Initialize
onMounted(async () => {
  await cmsStore.fetchEntries()
  if (cmsStore.entries.length > 0) {
    selectEntry(cmsStore.entries[0].id)
  }
})

// Computed list of filtered entries
const filteredEntries = computed(() => {
  return cmsStore.entries.filter(entry => {
    const matchesSearch = entry.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          entry.slug.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesType = selectedTypeFilter.value === 'all' || entry.type === selectedTypeFilter.value
    return matchesSearch && matchesType
  })
})

// Find current entry object
const currentEntry = computed(() => {
  return cmsStore.entries.find(e => e.id === selectedEntryId.value) || null
})

// Watch title to auto-suggest slug when creating
watch(() => form.value.title, (newTitle) => {
  if (isCreating.value) {
    form.value.slug = newTitle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
  }
})

// Watch form body when type is JSON to validate in real-time
watch([() => form.value.body, () => form.value.type], ([newBody, newType]) => {
  if (newType === 'json') {
    if (!newBody.trim()) {
      jsonError.value = null
      return
    }
    try {
      JSON.parse(newBody)
      jsonError.value = null
    } catch (err: any) {
      jsonError.value = err.message
    }
  } else {
    jsonError.value = null
  }
})

// Set form values for editing
const selectEntry = (id: string) => {
  isCreating.value = false
  selectedEntryId.value = id
  const entry = cmsStore.entries.find(e => e.id === id)
  if (entry) {
    form.value = {
      title: entry.title,
      slug: entry.slug,
      type: entry.type,
      body: entry.body,
      published: entry.published
    }
  }
  activeTab.value = 'edit'
}

// Prepare form for creating a new entry
const startCreate = () => {
  isCreating.value = true
  selectedEntryId.value = null
  form.value = {
    title: '',
    slug: '',
    type: 'text',
    body: '',
    published: true
  }
  activeTab.value = 'edit'
}

// Save entry (Create or Update)
const handleSave = async () => {
  if (!form.value.title.trim()) {
    toast({ title: 'Validation Error', description: 'Title is required.', intent: 'danger' })
    return
  }
  if (!form.value.slug.trim()) {
    toast({ title: 'Validation Error', description: 'Slug is required.', intent: 'danger' })
    return
  }
  if (form.value.type === 'json' && jsonError.value) {
    toast({ title: 'Validation Error', description: 'Please fix the JSON syntax before saving.', intent: 'danger' })
    return
  }

  saving.value = true
  try {
    if (isCreating.value) {
      const created = await cmsStore.createEntry({
        title: form.value.title.trim(),
        slug: form.value.slug.toLowerCase().trim().replace(/\s+/g, '-'),
        type: form.value.type,
        body: form.value.body,
        published: form.value.published
      })
      isCreating.value = false
      selectedEntryId.value = created.id
      toast({ title: 'Created', description: 'Content entry created.', intent: 'success' })
    } else if (selectedEntryId.value) {
      await cmsStore.updateEntry(selectedEntryId.value, {
        title: form.value.title.trim(),
        slug: form.value.slug.toLowerCase().trim().replace(/\s+/g, '-'),
        type: form.value.type,
        body: form.value.body,
        published: form.value.published
      })
      toast({ title: 'Saved', description: 'Changes saved.', intent: 'success' })
    }
  } catch (err: any) {
    toast({ title: 'Error', description: err.message || 'Failed to save.', intent: 'danger' })
  } finally {
    saving.value = false
  }
}

// Delete entry
const handleDelete = async () => {
  if (!selectedEntryId.value) return
  if (!confirm('Delete this content entry?')) return

  try {
    const deletedId = selectedEntryId.value
    await cmsStore.deleteEntry(deletedId)
    toast({ title: 'Deleted', description: 'Entry removed.', intent: 'info' })

    if (cmsStore.entries.length > 0) {
      selectEntry(cmsStore.entries[0].id)
    } else {
      selectedEntryId.value = null
      isCreating.value = false
    }
  } catch (err: any) {
    toast({ title: 'Error', description: err.message || 'Failed to delete.', intent: 'danger' })
  }
}

// Refresh CMS list
const handleRefresh = async () => {
  await cmsStore.fetchEntries()
  toast({ title: 'Refreshed', description: 'Content list updated.', intent: 'success', duration: 1500 })
}

// Helper to format timestamps
const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const copyLink = async () => {
  if (!form.value.slug) return
  const url = `${window.location.origin}/api/content/${form.value.slug}`
  try {
    await navigator.clipboard.writeText(url)
    toast({ title: 'Copied', description: 'API URL copied to clipboard.', intent: 'success', duration: 2000 })
  } catch (err: any) {
    toast({ title: 'Failed to copy', description: 'Could not copy URL to clipboard.', intent: 'danger' })
  }
}
</script>

<template>
  <ConsoleShell page-title="Content">
    <div class="cms-workspace">

      <!-- LEFT: Content list -->
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
          <MayaBtn size="icon" variant="outline" @click="startCreate" title="New entry">
            <PlusIcon :size="16" />
          </MayaBtn>
        </div>

        <!-- Filter pills -->
        <div class="filter-bar">
          <div class="filter-pills">
            <button
              class="pill"
              :class="{ active: selectedTypeFilter === 'all' }"
              @click="selectedTypeFilter = 'all'"
            >All</button>
            <button
              class="pill"
              :class="{ active: selectedTypeFilter === 'text' }"
              @click="selectedTypeFilter = 'text'"
            >Text</button>
            <button
              class="pill"
              :class="{ active: selectedTypeFilter === 'markdown' }"
              @click="selectedTypeFilter = 'markdown'"
            >MD</button>
            <button
              class="pill"
              :class="{ active: selectedTypeFilter === 'json' }"
              @click="selectedTypeFilter = 'json'"
            >JSON</button>
          </div>

          <button class="refresh-btn" title="Refresh" @click="handleRefresh">
            <RefreshCwIcon class="refresh-icon" :class="{ spinning: cmsStore.loading }" />
          </button>
        </div>

        <!-- Entries -->
        <div class="entries-scroll">
          <div v-if="cmsStore.loading && cmsStore.entries.length === 0" class="list-empty">
            <MayaSpinner size="md" />
            <span>Loading...</span>
          </div>

          <div v-else-if="filteredEntries.length === 0" class="list-empty">
            <BookOpenIcon class="empty-icon" />
            <span>No entries found</span>
          </div>

          <div v-else class="entries-list">
            <button
              v-for="entry in filteredEntries"
              :key="entry.id"
              class="entry-item"
              :class="{ active: selectedEntryId === entry.id && !isCreating }"
              @click="selectEntry(entry.id)"
            >
              <div class="entry-top">
                <span class="entry-name">{{ entry.title || 'Untitled' }}</span>
                <MayaBadge size="sm" variant="soft" :intent="entry.type === 'json' ? 'warning' : entry.type === 'markdown' ? 'info' : 'success'">
                  {{ entry.type }}
                </MayaBadge>
              </div>
              <div class="entry-slug">/api/content/{{ entry.slug }}</div>
              <div class="entry-meta">
                <span>{{ formatTime(entry.updatedAt) }}</span>
                <div class="status-indicator">
                  <div class="status-dot" :class="{ live: entry.published }"></div>
                  <span>{{ entry.published ? 'Live' : 'Draft' }}</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT: Editor -->
      <div class="editor-panel">

        <!-- Empty state -->
        <div v-if="!selectedEntryId && !isCreating" class="editor-empty">
          <MayaEmptyState
            :icon="LayersIcon"
            title="No entry selected"
            description="Select an entry from the list or create a new one to get started."
          >
            <template #action>
              <MayaBtn @click="startCreate">
                <PlusIcon :size="14" />
                New Entry
              </MayaBtn>
            </template>
          </MayaEmptyState>
        </div>

        <!-- Editor workspace -->
        <div v-else class="editor-workspace">

          <!-- Editor header -->
          <div class="editor-header">
            <div class="editor-header-left">
              <MayaBadge size="sm" :variant="isCreating ? 'muted' : 'outline'" :intent="isCreating ? 'success' : 'default'">
                {{ isCreating ? 'New' : 'Edit' }}
              </MayaBadge>
              <span class="editor-title">{{ form.title || 'Untitled' }}</span>
            </div>

            <div class="tab-switcher">
              <button
                type="button"
                class="tab-btn"
                :class="{ active: rightTab === 'edit' }"
                @click="rightTab = 'edit'"
              >Edit</button>
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

            <div class="editor-header-right">
              <MayaBtn
                v-if="!isCreating"
                variant="ghost"
                size="sm"
                intent="danger"
                @click="handleDelete"
              >
                <Trash2Icon :size="14" />
                Delete
              </MayaBtn>
              <MayaBtn
                class="save-btn"
                size="sm"
                :disabled="saving || cmsStore.loading || !!jsonError"
                @click="handleSave"
              >
                <MayaSpinner v-if="saving" class="save-btn-spinner" size="sm" />
                <SaveIcon v-else :size="14" />
                {{ saving ? (isCreating ? 'Creating...' : 'Saving...') : (isCreating ? 'Create' : 'Save') }}
              </MayaBtn>
            </div>
          </div>

          <!-- Form -->
          <div class="editor-body">

            <template v-if="rightTab === 'edit'">
              <div class="form-grid">
                <!-- Title -->
                <div class="field">
                  <label class="field-label">Title</label>
                  <MayaInput
                    v-model="form.title"
                    placeholder="e.g., Homepage Config"
                  />
                </div>

                <!-- Slug -->
                <div class="field">
                  <label class="field-label">Slug</label>
                  <MayaInputGroup>
                    <template #prefix>/content/</template>
                    <MayaInput
                      v-model="form.slug"
                      placeholder="homepage-config"
                    />
                  </MayaInputGroup>
                  <span class="field-hint">Route: /api/content/{{ form.slug || 'slug' }}</span>
                </div>

                <!-- Format -->
                <div class="field span-2">
                  <label class="field-label">Format</label>
                  <div class="format-control">
                    <button
                      type="button"
                      class="format-option"
                      :class="{ active: form.type === 'text' }"
                      @click="form.type = 'text'"
                    >
                      <FileTextIcon :size="14" />
                      <span>Text</span>
                    </button>
                    <button
                      type="button"
                      class="format-option"
                      :class="{ active: form.type === 'markdown' }"
                      @click="form.type = 'markdown'"
                    >
                      <FileCodeIcon :size="14" />
                      <span>Markdown</span>
                    </button>
                    <button
                      type="button"
                      class="format-option"
                      :class="{ active: form.type === 'json' }"
                      @click="form.type = 'json'"
                    >
                      <CodeIcon :size="14" />
                      <span>JSON</span>
                    </button>
                  </div>
                </div>

                <!-- Options row -->
                <div class="field span-2 options-row">
                  <div class="switch-field-group">
                    <span class="switch-label">Published Status</span>
                    <div class="switch-control-wrap">
                      <MayaSwitch v-model="form.published" />
                      <span class="switch-status-text" :class="{ 'is-live': form.published }">
                        {{ form.published ? 'Live / Published' : 'Draft / Private' }}
                      </span>
                    </div>
                  </div>

                  <div class="api-links-group" style="display: flex; gap: 16px; align-items: center;">
                    <a
                      v-if="!isCreating && currentEntry?.published"
                      :href="`/api/content/${form.slug}`"
                      target="_blank"
                      class="api-link"
                    >
                      <ExternalLinkIcon :size="12" />
                      Open API
                    </a>
                    <button
                      v-if="!isCreating && currentEntry?.published"
                      type="button"
                      class="api-link"
                      style="background: none; border: none; padding: 0; cursor: pointer; font-family: inherit;"
                      @click="copyLink"
                    >
                      <CopyIcon :size="12" />
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>

              <!-- Content body -->
              <div class="body-section">
                <div class="body-header">
                  <label class="field-label">Body</label>

                  <div v-if="form.type === 'markdown'" class="tab-switcher">
                    <button
                      class="tab-btn"
                      :class="{ active: activeTab === 'edit' }"
                      @click="activeTab = 'edit'"
                    >Source</button>
                    <button
                      class="tab-btn"
                      :class="{ active: activeTab === 'preview' }"
                      @click="activeTab = 'preview'"
                    >Preview</button>
                  </div>
                </div>

                <div class="editor-frame">
                  <!-- Source editor -->
                  <div v-if="activeTab === 'edit'" class="editor-input-wrap">
                    <textarea
                      v-model="form.body"
                      class="code-textarea"
                      :class="{ mono: form.type === 'json' || form.type === 'markdown' }"
                      :placeholder="placeholderText"
                      spellcheck="false"
                    ></textarea>
                  </div>

                  <!-- Markdown rendered preview -->
                  <div v-else-if="activeTab === 'preview'" class="preview-wrap">
                    <div v-if="!form.body.trim()" class="preview-empty">
                      Write some markdown to see the rendered preview.
                    </div>
                    <MayaProse v-else :content="form.body" />
                  </div>

                  <!-- JSON error -->
                  <div v-if="form.type === 'json' && jsonError" class="json-error">
                    <span class="error-dot"></span>
                    <span>{{ jsonError }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- API Tab -->
            <template v-else>
              <section class="api-section">
                <h3 class="api-section-label">Endpoint</h3>
                <div class="endpoint-row">
                  <MayaBadge variant="outline" size="sm">GET</MayaBadge>
                  <code class="endpoint-code">/api/content/<span class="endpoint-param">{{ form.slug || ':slug' }}</span></code>
                </div>
              </section>

              <div class="api-divider" />

              <section class="api-section">
                <h3 class="api-section-label">Authentication</h3>
                <div class="auth-line">
                  <code>Authorization: Bearer </code>
                  <span class="auth-token">YOUR_API_KEY</span>
                </div>
              </section>

              <div class="api-divider" />

              <section class="api-section">
                <h3 class="api-section-label">Example request</h3>
                <MayaCodeBlock :code="curlExample" lang="bash" :show-copy="true" />
              </section>

              <div class="api-divider" />

              <section class="api-section">
                <h3 class="api-section-label">Response fields</h3>
                <ul class="fields-list">
                  <li v-for="f in responseFields" :key="f.key" class="fields-row">
                    <code class="field-name">{{ f.key }}</code>
                    <span class="field-type">{{ f.type }}</span>
                  </li>
                </ul>
              </section>
            </template>
          </div>
        </div>
      </div>
    </div>
  </ConsoleShell>
</template>

<style scoped>
/* ── Workspace ── */
.cms-workspace {
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

/* ── Filters ── */
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

/* ── Entry list ── */
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

/* ── Editor Panel ── */
.editor-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 48px;
}
.editor-empty > * {
  max-width: 560px;
}

.editor-workspace {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 52px;
  padding: 0 24px;
  border-bottom: 1px dashed var(--maya-border);
  background-color: var(--maya-bg-root);
  gap: 16px;
}
.editor-header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.editor-title {
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--maya-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.editor-header-right {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

/* Spinner uses page text color by default — invisible on the light primary Save button */
.save-btn :deep(.save-btn-spinner .maya-spinner-track) {
  stroke: color-mix(in srgb, var(--maya-btn-primary-text) 35%, transparent);
}
.save-btn :deep(.save-btn-spinner .maya-spinner-arc) {
  stroke: var(--maya-btn-primary-text);
}

/* ── Editor Body ── */
.editor-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
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

/* ── Format control ── */
.format-control {
  display: flex;
  background-color: var(--maya-bg-root);
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  padding: 3px;
}
.format-option {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: var(--maya-radius-sm);
  color: var(--maya-text-muted);
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
  font-family: var(--maya-font-sans);
}
.format-option:hover {
  color: var(--maya-text-primary);
}
.format-option.active {
  background-color: var(--maya-bg-surface);
  color: var(--maya-text-primary);
  font-weight: 600;
}

/* ── Options row ── */
.options-row {
  flex-direction: row !important;
  justify-content: space-between;
  align-items: center;
}

.switch-field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.switch-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--maya-text-muted);
}

.switch-control-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.switch-status-text {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--maya-text-muted);
  transition: color 0.15s ease;
}

.switch-status-text.is-live {
  color: var(--maya-success);
  font-weight: 600;
}

.api-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.75rem;
  color: var(--maya-text-muted);
  text-decoration: none;
  transition: color 0.15s ease;
}
.api-link:hover {
  color: var(--maya-text-primary);
}

/* ── Body section ── */
.body-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
  min-height: 300px;
}
.body-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tab-switcher {
  display: flex;
  background-color: var(--maya-bg-root);
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  padding: 2px;
}
.tab-btn {
  border: none;
  background: transparent;
  padding: 4px 10px;
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

/* ── Editor frame ── */
.editor-frame {
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-md);
  background-color: var(--maya-bg-root);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
}

.editor-input-wrap {
  flex: 1;
  display: flex;
}
.code-textarea {
  width: 100%;
  height: 100%;
  min-height: 260px;
  border: none;
  background: transparent;
  padding: 16px;
  color: var(--maya-text-primary);
  font-family: var(--maya-font-sans);
  font-size: 0.8125rem;
  line-height: 1.7;
  outline: none;
  resize: none;
}
.code-textarea.mono {
  font-family: var(--maya-font-mono);
  font-size: 0.8125rem;
}

.preview-wrap {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 260px;
}
.preview-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--maya-text-muted);
  font-size: 0.8125rem;
}

/* ── JSON error ── */
.json-error {
  display: flex;
  align-items: center;
  padding: 8px 16px;
  gap: 8px;
  border-top: 1px solid color-mix(in srgb, var(--maya-danger) 40%, transparent);
  background-color: color-mix(in srgb, var(--maya-danger) 8%, transparent);
  font-size: 0.6875rem;
  color: var(--maya-danger);
  font-family: var(--maya-font-mono);
}
.error-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background-color: var(--maya-danger);
  flex-shrink: 0;
}

/* ── API Section ── */
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

.api-divider {
  height: 1px;
  margin: 8px 0;
  background: repeating-linear-gradient(
    to right,
    var(--maya-border) 0,
    var(--maya-border) 4px,
    transparent 4px,
    transparent 8px
  );
}

.endpoint-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.endpoint-code {
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
</style>
