<template>
  <div class="flex flex-col gap-1 w-full">
    <label v-if="label" class="text-[14px] text-secondary font-medium">{{ label }}</label>
    <div
      class="border border-gray-400 rounded-sm overflow-hidden transition-all hover:border-gray-500 focus-within:border-gray-600 focus-within:ring-2 focus-within:ring-blue-700/20 focus-within:border-blue-700"
    >
      <Codemirror
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :extensions="extensions"
        class="cm-editor-wrapper"
        :style="{ minHeight }"
        :autofocus="autofocus"
        :disabled="disabled"
        :tab-size="2"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Codemirror } from 'vue-codemirror'
import { json } from '@codemirror/lang-json'
import { markdown } from '@codemirror/lang-markdown'
import { xml } from '@codemirror/lang-xml'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'

const props = defineProps({
  modelValue: { type: String, default: '' },
  label: String,
  placeholder: String,
  language: { type: String, default: 'markdown' },
  minHeight: { type: String, default: '300px' },
  autofocus: Boolean,
  disabled: Boolean,
})

defineEmits(['update:modelValue'])

const colorMode = useColorMode()

const langExtension = computed(() => {
  switch (props.language) {
    case 'json': return json()
    case 'markdown': return markdown()
    case 'xml': return xml()
    default: return []
  }
})

const baseTheme = computed(() => {
  return EditorView.theme({
    '&': {
      minHeight: props.minHeight,
    },
    '.cm-scroller': {
      minHeight: props.minHeight,
      overflow: 'auto',
    }
  })
})

const appTheme = computed(() => {
  return EditorView.theme({
    '&': {
      backgroundColor: 'var(--bg-root)',
      color: 'var(--text-primary)',
      fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
      fontSize: '14px',
    },
    '.cm-scroller': {
      fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace",
    },
    '.cm-content': {
      caretColor: 'var(--text-primary)',
      padding: '8px 12px',
    },
    '.cm-cursor': {
      borderLeftColor: 'var(--text-primary)',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
      backgroundColor: 'var(--bg-surface-3) !important',
    },
    '.cm-activeLine': {
      backgroundColor: 'transparent',
    },
    '.cm-gutters': {
      backgroundColor: 'var(--bg-surface-2)',
      color: 'var(--text-muted)',
      borderRight: '1px solid var(--border-default)',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    '.cm-placeholder': {
      color: 'var(--text-muted)',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'var(--bg-surface-3)',
      color: 'var(--text-primary)'
    }
  }, { dark: colorMode.value === 'dark' })
})

const extensions = computed(() => {
  const isDark = colorMode.value === 'dark'
  return [
    baseTheme.value,
    langExtension.value,
    EditorView.lineWrapping,
    isDark ? [oneDark, appTheme.value] : appTheme.value,
  ]
})
</script>
