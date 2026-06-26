<template>
  <div
    v-for="folder in folders"
    :key="folder.id"
    role="button"
    tabindex="0"
    :class="['entry-card folder-card group', dragHoverTarget === folder.id ? 'drag-hover-indicator' : '']"
    style="flex-direction: row; align-items: center; gap: 12px;"
    @click="$emit('enter', folder)"
    @keydown.enter.prevent="$emit('enter', folder)"
    @dragenter.prevent="onDragEnter(folder.id)"
    @dragleave.prevent="onDragLeave(folder.id)"
    @dragover.prevent
    @drop.prevent="onDrop(folder.id, $event)"
  >
    <Icon name="lucide:folder" class="w-5 h-5 text-secondary group-hover:text-primary transition-colors flex-shrink-0" style="pointer-events: none;" />
    <span class="entry-title" style="pointer-events: none;">{{ folder.name }}</span>
    <button class="icon-btn opacity-0 group-hover:opacity-100 transition-opacity ml-auto flex-shrink-0" @click.stop="$emit('delete', folder)">
      <Icon name="lucide:trash" class="w-3.5 h-3.5" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

defineProps<{
  folders: any[]
}>()

const emit = defineEmits<{
  (e: 'enter', folder: any): void
  (e: 'delete', folder: any): void
  (e: 'drop', folderId: string | null, event: DragEvent): void
}>()

const dragHoverTarget = ref<string | null | false>(false)
const dragCounters = reactive<Record<string, number>>({})

function onDragEnter(folderId: string) {
  if (!dragCounters[folderId]) dragCounters[folderId] = 0
  dragCounters[folderId]++
  dragHoverTarget.value = folderId
}

function onDragLeave(folderId: string) {
  if (!dragCounters[folderId]) dragCounters[folderId] = 0
  dragCounters[folderId]--
  if (dragCounters[folderId] <= 0) {
    dragCounters[folderId] = 0
    if (dragHoverTarget.value === folderId) dragHoverTarget.value = false
  }
}

function onDrop(folderId: string | null, e: DragEvent) {
  dragHoverTarget.value = false
  Object.keys(dragCounters).forEach(k => dragCounters[k] = 0)
  emit('drop', folderId, e)
}
</script>

<style scoped>
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

.entry-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
