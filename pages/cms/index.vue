<template>
  <div class="cms-layout">
    <!-- ═══════════ LEFT PANEL: NAVIGATION ═══════════ -->
    <aside class="list-panel">
      <!-- Header / Breadcrumbs -->
      <div class="list-header">
        <FolderBreadcrumbs
          :breadcrumbs="breadcrumbs"
          @navigate="navigateToFolder"
          @drop="onFolderDrop"
        />

        <div class="search-row">
          <GeistInput
            v-model="searchQuery"
            placeholder="Search entries…"
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

      <!-- Main List -->
      <div class="list-body">
        <div v-if="pending" class="list-empty">
          <Icon name="lucide:loader-2" class="w-5 h-5 text-secondary animate-spin" />
          <span class="text-[13px] text-secondary mt-2">Loading…</span>
        </div>

        <div v-else-if="!filteredEntries?.length && !folders?.length" class="list-empty">
          <Icon name="lucide:inbox" class="w-6 h-6 text-secondary opacity-50" />
          <span class="text-[13px] text-secondary mt-2">No content yet</span>
          <button class="text-[12px] text-primary underline mt-1" @click="startCreating">Create one</button>
        </div>

        <template v-else>
          <!-- Folders -->
          <FolderList
            :folders="folders || []"
            @enter="enterFolder"
            @delete="deleteFolder"
            @drop="onFolderDrop"
          />

          <!-- Entries -->
          <EntryCard
            v-for="entry in filteredEntries"
            :key="entry.id"
            :entry="entry"
            :is-selected="selectedId === entry.id && !isCreating"
            @select="selectEntry"
            @dragstart="onDragEntryStart"
          />
        </template>
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
      <EditorPanel
        v-else
        :entry="selectedEntry"
        :is-creating="isCreating"
        :saving="saving"
        :base-url="baseUrl"
        @save="handleSave"
        @delete="handleDelete"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

import { ref, computed } from 'vue'
import FolderBreadcrumbs from '~/components/FolderBreadcrumbs.vue'
import FolderList from '~/components/FolderList.vue'
import EntryCard from '~/components/cms/EntryCard.vue'
import EditorPanel from '~/components/cms/EditorPanel.vue'

// ── State ──────────────────────────────────────
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

const searchQuery = ref('')
const activeFilter = ref<'all' | 'text' | 'markdown' | 'json'>('all')

const selectedId = ref<string | null>(null)
const isCreating = ref(false)
const saving = ref(false)

const filters = [
  { label: 'All', value: 'all' as const },
  { label: 'Text', value: 'text' as const },
  { label: 'MD', value: 'markdown' as const },
  { label: 'JSON', value: 'json' as const },
]

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

// ── Folder Drag & Drop ─────────────────────────
async function onFolderDrop(targetFolderId: string | null, e: DragEvent) {
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

function selectEntry(id: string) {
  isCreating.value = false
  selectedId.value = id
}

function startCreating() {
  isCreating.value = true
  selectedId.value = null
}

async function handleSave(formData: any) {
  saving.value = true
  try {
    if (isCreating.value) {
      const created: any = await $fetch('/api/cms', {
        method: 'POST',
        body: { ...formData, folderId: currentFolderId.value },
      })
      await refresh()
      isCreating.value = false
      selectedId.value = created?.id ?? null
    } else if (selectedId.value) {
      await $fetch(`/api/cms/${selectedId.value}`, {
        method: 'PUT',
        body: { ...formData, folderId: currentFolderId.value },
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

.empty-state-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  max-width: 280px;
}
</style>
