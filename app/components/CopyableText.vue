<script setup lang="ts">
import { ref } from 'vue'
import { CopyIcon, CheckIcon } from 'lucide-vue-next'

const props = defineProps<{
  text: string
  copyable?: boolean
}>()

const copied = ref(false)

async function copy() {
  if (!props.copyable || !props.text) return
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 1500)
  } catch { /* ignore */ }
}
</script>

<template>
  <span class="copyable-text" :class="{ 'copyable-text--copyable': copyable !== false }">
    <code class="copyable-text-code">{{ text }}</code>
    <button
      v-if="copyable !== false"
      type="button"
      class="copyable-text-btn"
      :aria-label="copied ? 'Copied' : 'Copy'"
      @click="copy"
    >
      <CheckIcon v-if="copied" :size="12" class="copyable-text-icon copied" />
      <CopyIcon v-else :size="12" class="copyable-text-icon" />
    </button>
  </span>
</template>

<style scoped>
.copyable-text {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 100%;
  padding: 3px 8px;
  border: 1px solid var(--maya-border);
  border-radius: var(--maya-radius-sm);
  background: var(--maya-bg-raised);
  font-family: var(--maya-font-mono);
  font-size: 0.8125rem;
  line-height: 1.5;
  vertical-align: middle;
}

.copyable-text-code {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--maya-text-primary);
}

.copyable-text-btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 2px;
  border: none;
  border-radius: var(--maya-radius-sm);
  background: transparent;
  color: var(--maya-text-muted);
  cursor: pointer;
}

.copyable-text-btn:hover {
  color: var(--maya-text-primary);
}

.copyable-text-icon.copied {
  color: var(--maya-success);
}
</style>
