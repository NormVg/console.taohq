<template>
  <div
    role="button"
    tabindex="0"
    :class="['entry-card', { selected: isSelected }]"
    draggable="true"
    @dragstart="onDragStart"
    @click="$emit('select', entry.id)"
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
</template>

<script setup lang="ts">
import { format } from 'date-fns'

const props = defineProps<{
  entry: any
  isSelected: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'dragstart', entry: any, event: DragEvent): void
}>()

function onDragStart(e: DragEvent) {
  emit('dragstart', props.entry, e)
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
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.entry-status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.status-dot.live { background: var(--bg-success); }
.status-dot.draft { background: var(--text-tertiary); }
</style>
