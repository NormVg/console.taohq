<template>
  <span
    :class="[
      'inline-flex items-center rounded-full px-2 py-0.5 text-[12px] font-medium',
      variantClasses[variant]
    ]"
  >
    <slot />
  </span>
</template>

<script setup lang="ts">
const props = defineProps({
  variant: {
    type: String,
    default: 'neutral',
    validator: (v: string) => ['neutral', 'success', 'warning', 'error', 'blue'].includes(v)
  }
})

const variantClasses = {
  neutral: 'bg-background-200 text-secondary border border-gray-400',
  success: 'bg-green-100 text-green-900 border border-green-400 dark:bg-green-900/20 dark:text-green-300',
  warning: 'bg-amber-100 text-amber-900 border border-amber-400 dark:bg-amber-900/20 dark:text-amber-300',
  error: 'bg-red-100 text-red-900 border border-red-400 dark:bg-red-900/20 dark:text-red-300',
  blue: 'bg-blue-100 text-blue-900 border border-blue-400 dark:bg-blue-900/20 dark:text-blue-300'
}
</script>
