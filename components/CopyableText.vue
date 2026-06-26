<template>
  <div class="flex items-center justify-between gap-2 p-3 bg-background-200 border border-gray-400 rounded-sm">
    <code class="text-[13px] font-mono text-primary truncate">{{ text }}</code>
    <button
      @click="copy"
      class="flex items-center justify-center flex-shrink-0 w-7 h-7 text-gray-700 hover:text-primary hover:bg-gray-300 rounded-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-700 focus:ring-offset-1 focus:ring-offset-gray-100"
      title="Copy to clipboard"
    >
      <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-4 h-4" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{
  text: string
}>()

const copied = ref(false)

const copy = async () => {
  try {
    await navigator.clipboard.writeText(props.text)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    console.error('Failed to copy text', e)
  }
}
</script>
