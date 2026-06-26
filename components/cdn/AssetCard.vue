<template>
  <div
    role="button"
    tabindex="0"
    :class="['entry-card', isSelected && 'selected']"
    draggable="true"
    @dragstart="onDragStart"
    @click="$emit('select', asset.key)"
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
      <ClientOnly>
        <span>{{ formatDate(asset.createdAt) }}</span>
        <template #fallback><span>...</span></template>
      </ClientOnly>
      <span class="meta-dot" />
      <span>{{ asset.storageType || 'default' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { format } from 'date-fns'

const props = defineProps<{
  asset: any
  isSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'select', key: string): void
  (e: 'dragstart', asset: any, event: DragEvent): void
}>()

function onDragStart(e: DragEvent) {
  emit('dragstart', props.asset, e)
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
}

.entry-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.entry-route {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 2px 0;
}

.entry-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
}

.meta-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: var(--text-tertiary);
}
</style>
