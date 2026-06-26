<template>
  <div class="flex items-center gap-1 overflow-x-auto pb-1 text-[13px] font-semibold text-secondary whitespace-nowrap">
    <template v-for="(crumb, idx) in breadcrumbs" :key="idx">
      <span v-if="idx > 0" class="mx-1 text-secondary/50">/</span>
      <button
        class="hover:text-primary transition-colors cursor-pointer"
        :class="['flex items-center gap-1.5 px-2 py-1 -ml-2 rounded-md hover:bg-muted/50 transition-colors', idx === breadcrumbs.length - 1 ? 'text-primary' : '', dragHoverTarget === (crumb.id || '__root__') ? 'drag-hover-indicator' : '']"
        @click="$emit('navigate', crumb.id, idx)"
        @dragenter.prevent="onDragEnter(crumb.id || '__root__')"
        @dragleave.prevent="onDragLeave(crumb.id || '__root__')"
        @dragover.prevent
        @drop.prevent="onDrop(crumb.id, $event)"
      >
        {{ crumb.name }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'

defineProps<{
  breadcrumbs: Array<{ id: string | null; name: string }>
}>()

const emit = defineEmits<{
  (e: 'navigate', id: string | null, index: number): void
  (e: 'drop', id: string | null, event: DragEvent): void
}>()

const dragHoverTarget = ref<string | null | false>(false)
const dragCounters = reactive<Record<string, number>>({})

function onDragEnter(id: string) {
  if (!dragCounters[id]) dragCounters[id] = 0
  dragCounters[id]++
  dragHoverTarget.value = id
}

function onDragLeave(id: string) {
  if (!dragCounters[id]) dragCounters[id] = 0
  dragCounters[id]--
  if (dragCounters[id] <= 0) {
    dragCounters[id] = 0
    if (dragHoverTarget.value === id) dragHoverTarget.value = false
  }
}

function onDrop(id: string | null, e: DragEvent) {
  dragHoverTarget.value = false
  Object.keys(dragCounters).forEach(k => dragCounters[k] = 0)
  emit('drop', id, e)
}
</script>
