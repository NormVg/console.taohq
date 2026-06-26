<template>
  <div class="flex flex-col gap-1 w-full">
    <label v-if="label" :for="inputId" class="text-[14px] text-secondary font-medium">{{ label }}</label>
    <div class="relative flex items-center">
      <div v-if="$slots.prefix" class="absolute left-3 text-gray-700 flex items-center">
        <slot name="prefix" />
      </div>
      <component
        :is="multiline ? 'textarea' : 'input'"
        :id="inputId"
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        :type="type"
        :placeholder="placeholder"
        :disabled="disabled"
        :class="[
          'w-full bg-background-100 border border-gray-400 rounded-sm text-primary text-[14px] transition-all placeholder:text-gray-500',
          'hover:border-gray-500 focus:outline-none focus:border-gray-600 focus:ring-2 focus:ring-blue-700/20 focus:border-blue-700',
          'disabled:bg-background-200 disabled:text-secondary disabled:cursor-not-allowed',
          $slots.prefix ? 'pl-9' : 'px-3',
          multiline ? 'py-2 min-h-[100px]' : sizeClasses[size]
        ]"
      />
    </div>
    <span v-if="error" class="text-[13px] text-red-800 mt-1">{{ error }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  disabled: Boolean,
  error: String,
  multiline: Boolean,
  id: String,
  size: {
    type: String,
    default: 'md',
    validator: (v: string) => ['sm', 'md', 'lg'].includes(v)
  }
})

defineEmits(['update:modelValue'])

const _id = useId()
const inputId = computed(() => props.id || _id)

const sizeClasses = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12'
}
</script>
