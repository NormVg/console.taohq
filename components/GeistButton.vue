<template>
  <button
    :class="[
      'inline-flex items-center justify-center font-medium rounded-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-700 focus-visible:ring-offset-white',
      variantClasses[variant],
      sizeClasses[size]
    ]"
    :disabled="disabled || loading"
  >
    <Icon v-if="loading" name="lucide:loader-2" class="w-4 h-4 mr-2 animate-spin" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v: string) => ['primary', 'secondary', 'tertiary', 'error'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (v: string) => ['sm', 'md', 'lg'].includes(v)
  },
  disabled: Boolean,
  loading: Boolean
})

const variantClasses = {
  primary: 'bg-primary text-background-100 hover:bg-gray-900 active:bg-gray-800 disabled:bg-gray-100 disabled:text-gray-700 disabled:cursor-not-allowed',
  secondary: 'bg-background-100 text-primary border border-gray-400 hover:bg-background-200 active:bg-background-300 disabled:bg-background-200 disabled:text-secondary disabled:cursor-not-allowed',
  tertiary: 'bg-transparent text-secondary hover:text-primary hover:bg-background-200 active:bg-background-300 disabled:text-gray-400 disabled:cursor-not-allowed border border-transparent',
  error: 'bg-red-800 text-white hover:bg-red-900 active:bg-red-1000 disabled:bg-red-200 disabled:text-red-400 disabled:cursor-not-allowed'
}

const sizeClasses = {
  sm: 'h-8 px-2 text-[14px] leading-5',
  md: 'h-10 px-3 text-[14px] leading-5',
  lg: 'h-12 px-4 text-[16px] leading-5'
}
</script>
