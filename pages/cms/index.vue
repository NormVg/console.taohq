<template>
  <div class="cms-layout">
    <!-- ═══════════ LEFT PANEL: LIST ═══════════ -->
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
            placeholder="Search…"
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
          <button class="icon-btn create-btn" title="New entry" @click="startCreating">
            <Icon name="lucide:plus" class="w-4 h-4" />
          </button>
        </div>

        <div class="filter-row">
          <div class="filter-pills">
            <button
              v-for="f in filters"
              :key="f.value"
              :class="['filter-pill', { active: activeFilter === f.value }]"
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

      <div class="list-body">
        <div v-if="pending" class="list-empty">
          <Icon name="lucide:loader-2" class="w-4 h-4 animate-spin text-secondary" />
          <span class="text-[13px] text-secondary">Loading…</span>
        </div>

        <div v-else-if="!filteredEntries.length && !folders?.length" class="list-empty">
          <span class="text-[13px] text-secondary">No entries found.</span>
        </div>

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

        <!-- Entries -->
        <div
          v-for="entry in filteredEntries"
          :key="entry.id"
          role="button"
          tabindex="0"
          :class="['entry-card', { selected: selectedId === entry.id && !isCreating }]"
          draggable="true"
          @dragstart="onDragEntryStart(entry, $event)"
          @click="selectEntry(entry.id)"
        >
          <div class="entry-top">
            <span class="entry-title">{{ entry.title }}</span>
            <GeistBadge :variant="typeBadgeVariant(entry.type)">
              {{ typeLabel(entry.type) }}
            </GeistBadge>
          </div>
          <span class="entry-route">/api/content/{{ entry.slug }}</span>
          <div class="entry-meta">
            <span>{{ formatDate(entry.createdAt) }}</span>
            <span class="entry-status">
              <span :class="['status-dot', entry.published ? 'live' : 'draft']" />
              {{ entry.published ? 'Live' : 'Draft' }}
            </span>
          </div>
        </div>
      </div>
    </aside>

    <!-- ═══════════ RIGHT PANEL: DETAIL / EDIT ═══════════ -->
    <main class="detail-panel">
      <!-- Empty state -->
      <div v-if="!selectedEntry && !isCreating" class="empty-state">
        <div class="empty-state-inner">
          <Icon name="lucide:file-text" class="w-10 h-10 text-secondary opacity-40" />
          <h2 class="text-[15px] font-semibold text-primary mt-4">Select an entry</h2>
          <p class="text-[13px] text-secondary mt-1">Choose an entry from the list or create a new one.</p>
        </div>
      </div>

      <!-- Editor / API view -->
      <template v-else>
        <!-- Action bar -->
        <div class="action-bar">
          <div class="action-bar-left">
            <span class="action-bar-title">
              {{ isCreating ? 'New Entry' : `Edit — ${form.title || 'Untitled'}` }}
            </span>
          </div>

          <div class="tab-toggle">
            <button
              :class="['tab-btn', { active: activeTab === 'edit' }]"
              @click="activeTab = 'edit'"
            >
              Edit
            </button>
            <button
              :class="['tab-btn', { active: activeTab === 'api' }]"
              @click="activeTab = 'api'"
              :disabled="isCreating"
            >
              API
            </button>
          </div>

          <div class="action-bar-right">
            <GeistButton
              v-if="!isCreating"
              variant="error"
              size="sm"
              @click="handleDelete"
            >
              <Icon name="lucide:trash-2" class="w-3.5 h-3.5 mr-1" />
              Delete
            </GeistButton>
            <GeistButton
              size="sm"
              :loading="saving"
              @click="handleSave"
            >
              {{ isCreating ? 'Create' : 'Save' }}
            </GeistButton>
          </div>
        </div>

        <!-- Edit tab -->
        <div v-if="activeTab === 'edit'" class="form-body">
          <div class="form-grid-2">
            <GeistInput v-model="form.title" label="Title" placeholder="e.g. Getting Started" />
            <GeistInput v-model="form.slug" label="Slug" placeholder="e.g. getting-started" />
          </div>
          <p class="slug-hint">Route: /api/content/{{ form.slug || '…' }}</p>

          <!-- Format selector -->
          <div class="field-group">
            <label class="field-label">Format</label>
            <div class="segmented-control">
              <button
                v-for="fmt in formats"
                :key="fmt.value"
                :class="['segment-btn', { active: form.type === fmt.value }]"
                @click="form.type = fmt.value"
              >
                <Icon :name="fmt.icon" class="w-3.5 h-3.5" />
                {{ fmt.label }}
              </button>
            </div>
          </div>

          <!-- Published toggle row -->
          <div class="publish-row">
            <label class="toggle-label">
              <button
                type="button"
                role="switch"
                :aria-checked="form.published"
                :class="['toggle-switch', { on: form.published }]"
                @click="form.published = !form.published"
              >
                <span class="toggle-thumb" />
              </button>
              <span class="text-[14px] font-medium text-secondary">
                {{ form.published ? 'Live / Published' : 'Draft' }}
              </span>
            </label>

            <div v-if="!isCreating" class="publish-actions">
              <GeistButton
                variant="tertiary"
                size="sm"
                @click="openUrl(`/api/content/${form.slug}`)"
              >
                <Icon name="lucide:external-link" class="w-3.5 h-3.5 mr-1" />
                Open API
              </GeistButton>
              <GeistButton variant="tertiary" size="sm" @click="copyLink">
                <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-3.5 h-3.5 mr-1" />
                {{ copied ? 'Copied' : 'Copy Link' }}
              </GeistButton>
            </div>
          </div>

          <!-- Editor -->
          <GeistEditor
            v-model="form.body"
            label="Body"
            :language="form.type === 'json' ? 'json' : form.type === 'markdown' ? 'markdown' : 'text'"
            min-height="300px"
          />
        </div>

        <!-- API tab -->
        <div v-if="activeTab === 'api' && selectedEntry" class="form-body">
          <div class="api-section">
            <h3 class="api-heading">Endpoint</h3>
            <div class="api-card">
              <span class="api-method">GET</span>
              <code class="api-url">/api/content/{{ selectedEntry.slug }}</code>
            </div>
          </div>

          <div class="api-section">
            <h3 class="api-heading">cURL</h3>
            <div class="api-code-block">
              <pre><code>curl {{ baseUrl }}/api/content/{{ selectedEntry.slug }}</code></pre>
            </div>
          </div>

          <div class="api-section">
            <h3 class="api-heading">Response</h3>
            <div class="api-code-block">
              <pre><code>{
  "id": "{{ selectedEntry.id }}",
  "title": "{{ selectedEntry.title }}",
  "slug": "{{ selectedEntry.slug }}",
  "type": "{{ selectedEntry.type }}",
  "body": "…",
  "published": {{ selectedEntry.published }},
  "createdAt": "{{ selectedEntry.createdAt }}"
}</code></pre>
            </div>
          </div>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

import { format } from 'date-fns'

// ── State ──────────────────────────────────────
const selectedId = ref<string | null>(null)
const activeTab = ref<'edit' | 'api'>('edit')
const searchQuery = ref('')
const activeFilter = ref<'all' | 'text' | 'markdown' | 'json'>('all')
const isCreating = ref(false)
const saving = ref(false)
const copied = ref(false)

const form = ref({
  title: '',
  slug: '',
  type: 'markdown' as 'text' | 'markdown' | 'json',
  body: '',
  published: true,
})

const filters = [
  { label: 'All', value: 'all' as const },
  { label: 'Text', value: 'text' as const },
  { label: 'MD', value: 'markdown' as const },
  { label: 'JSON', value: 'json' as const },
]

const formats = [
  { label: 'Text', value: 'text', icon: 'lucide:file-text' },
  { label: 'Markdown', value: 'markdown', icon: 'lucide:file-code' },
  { label: 'JSON', value: 'json', icon: 'lucide:braces' },
]

// ── Data ───────────────────────────────────────
const currentFolderId = ref<string | null>(null)
const breadcrumbs = ref<{ id: string | null; name: string }[]>([{ id: null, name: 'Content' }])

const { data: folders, refresh: refreshFolders } = useFetch<any[]>('/api/folders', {
  query: computed(() => ({ type: 'cms', parentId: currentFolderId.value || 'null' }))
})

const { data: entries, pending, refresh: refreshEntries } = useFetch<any[]>('/api/cms', {
  query: computed(() => ({ folderId: currentFolderId.value || 'null' }))
})

async function refresh() {
  await Promise.all([refreshFolders(), refreshEntries()])
}

const baseUrl = computed(() => {
  if (import.meta.client) return window.location.origin
  return ''
})

const filteredEntries = computed(() => {
  if (!entries.value) return []
  let list = entries.value

  if (activeFilter.value !== 'all') {
    list = list.filter((e: any) => e.type === activeFilter.value)
  }

  const q = searchQuery.value.toLowerCase().trim()
  if (q) {
    list = list.filter(
      (e: any) =>
        e.title?.toLowerCase().includes(q) ||
        e.slug?.toLowerCase().includes(q),
    )
  }

  return list
})

const selectedEntry = computed(() => {
  if (!entries.value || !selectedId.value) return null
  return entries.value.find((e: any) => e.id === selectedId.value) || null
})

// ── Watchers ───────────────────────────────────
watch(selectedEntry, (entry) => {
  if (entry) {
    form.value = {
      title: entry.title ?? '',
      slug: entry.slug ?? '',
      type: entry.type ?? 'markdown',
      body: entry.body ?? '',
      published: entry.published ?? true,
    }
  }
}, { immediate: true })

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
// ── Actions ────────────────────────────────────

function navigateToFolder(id: string | null, index: number) {
  currentFolderId.value = id
  breadcrumbs.value = breadcrumbs.value.slice(0, index + 1)
  selectedId.value = null
  isCreating.value = false
}

function enterFolder(folder: any) {
  currentFolderId.value = folder.id
  breadcrumbs.value.push({ id: folder.id, name: folder.name })
  selectedId.value = null
  isCreating.value = false
}

async function createNewFolder() {
  const name = prompt('Folder name:')
  if (!name) return
  try {
    await $fetch('/api/folders', {
      method: 'POST',
      body: { name, type: 'cms', parentId: currentFolderId.value }
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

function onDragEntryStart(entry: any, e: DragEvent) {
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'entry', id: entry.id }))
  }
}

async function onDropIntoFolder(targetFolderId: string | null, e: DragEvent) {
  const data = e.dataTransfer?.getData('text/plain') || e.dataTransfer?.getData('application/json')
  if (!data) return
  const payload = JSON.parse(data)
  if (payload.type === 'entry') {
    try {
      await $fetch(`/api/cms/${payload.id}`, {
        method: 'PATCH',
        body: { folderId: targetFolderId }
      })
      await refreshEntries()
    } catch (err) {
      alert('Failed to move entry')
    }
  }
}

function selectEntry(id: string) {
  isCreating.value = false
  selectedId.value = id
  activeTab.value = 'edit'
}

function startCreating() {
  isCreating.value = true
  selectedId.value = null
  activeTab.value = 'edit'
  form.value = { title: '', slug: '', type: 'markdown', body: '', published: true }
}

async function handleSave() {
  saving.value = true
  try {
    if (isCreating.value) {
      const created: any = await $fetch('/api/cms', {
        method: 'POST',
        body: form.value,
      })
      await refresh()
      isCreating.value = false
      selectedId.value = created?.id ?? null
    } else if (selectedId.value) {
      await $fetch(`/api/cms/${selectedId.value}`, {
        method: 'PUT',
        body: form.value,
      })
      await refresh()
    }
  } catch (e) {
    console.error('Save failed:', e)
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!selectedId.value) return
  if (!confirm('Are you sure you want to delete this entry?')) return
  try {
    await $fetch(`/api/cms/${selectedId.value}`, { method: 'DELETE' })
    selectedId.value = null
    await refresh()
  } catch (e) {
    console.error('Delete failed:', e)
  }
}

async function copyLink() {
  if (!form.value.slug) return
  const url = `${window.location.origin}/api/content/${form.value.slug}`
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    console.error('Copy failed:', e)
  }
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}

function formatDate(dateStr: string) {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'dd MMM, hh:mm a').toLowerCase()
}

function typeBadgeVariant(type: string) {
  const map: Record<string, string> = { text: 'neutral', markdown: 'blue', json: 'warning' }
  return (map[type] ?? 'neutral') as any
}

function typeLabel(type: string) {
  const map: Record<string, string> = { text: 'TXT', markdown: 'MD', json: 'JSON' }
  return map[type] ?? type
}
</script>

<style scoped>
/* ── Layout ─────────────────────────────────── */
.cms-layout {
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

/* ── Entry list ─────────────────────────────── */
.list-body {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
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

.entry-status {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 9999px;
}

.status-dot.live {
  background: #22c55e;
}

.status-dot.draft {
  background: var(--text-muted);
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

/* ── Empty state ────────────────────────────── */
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
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

/* ── Form body ──────────────────────────────── */
.form-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.slug-hint {
  font-family: 'Geist Mono', monospace;
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: -12px;
}

/* ── Field group ────────────────────────────── */
.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
}

/* ── Segmented control ──────────────────────── */
.segmented-control {
  display: inline-flex;
  background: var(--bg-surface-2);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.segment-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  background: transparent;
  transition: background 150ms ease, color 150ms ease, box-shadow 150ms ease;
  min-height: 32px;
}

.segment-btn.active {
  background: var(--bg-root);
  color: var(--text-primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
}

.segment-btn:not(.active):hover {
  color: var(--text-primary);
}

.segment-btn:active {
  transform: scale(0.96);
}

/* ── Publish row ────────────────────────────── */
.publish-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.toggle-label {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.toggle-switch {
  position: relative;
  width: 40px;
  height: 22px;
  border-radius: 9999px;
  background: var(--border-default);
  border: none;
  cursor: pointer;
  transition: background 200ms ease;
  flex-shrink: 0;
}

.toggle-switch.on {
  background: var(--text-primary);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 9999px;
  background: var(--bg-root);
  transition: transform 200ms ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.toggle-switch.on .toggle-thumb {
  transform: translateX(18px);
}

.publish-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}



/* ── API tab ────────────────────────────────── */
.api-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.api-heading {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.api-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: 6px;
}

.api-method {
  font-size: 12px;
  font-weight: 700;
  color: #22c55e;
  font-family: 'Geist Mono', monospace;
}

.api-url {
  font-size: 13px;
  font-family: 'Geist Mono', monospace;
  color: var(--text-primary);
}

.api-code-block {
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 14px 16px;
  overflow-x: auto;
}

.api-code-block pre {
  margin: 0;
}

.api-code-block code {
  font-family: 'Geist Mono', monospace;
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.6;
  white-space: pre;
}
</style>
