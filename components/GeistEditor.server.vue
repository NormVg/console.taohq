<template>
  <div class="flex flex-col gap-1 w-full">
    <label v-if="label" class="text-[14px] text-secondary font-medium">{{ label }}</label>
    <div class="border border-gray-400 rounded-sm overflow-hidden">
      <textarea
        :value="modelValue"
        class="w-full px-3 py-2 bg-background-100 text-primary text-[14px] font-mono focus:outline-none placeholder:text-gray-500"
        :style="{ minHeight }"
        :disabled="disabled"
        :placeholder="placeholder"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps({
  modelValue: { type: String, default: '' },
  label: String,
  placeholder: String,
  language: { type: String, default: 'markdown' },
  minHeight: { type: String, default: '300px' },
  autofocus: Boolean,
  disabled: Boolean,
})
</script>
