<template>
  <div v-if="modelValue" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
    <!-- Backdrop -->
    <div 
      class="absolute inset-0 bg-gray-alpha-800 transition-opacity" 
      @click="closeOnOutsideClick && $emit('update:modelValue', false)"
    ></div>
    
    <!-- Modal -->
    <div 
      class="relative bg-background-100 rounded-md shadow-modal w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden"
      role="dialog"
      aria-modal="true"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-gray-400 flex items-center justify-between">
        <h2 class="text-[20px] font-semibold text-primary">{{ title }}</h2>
        <button 
          @click="$emit('update:modelValue', false)"
          class="text-gray-700 hover:text-primary transition-colors p-1 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"
        >
          <Icon name="lucide:x" class="w-5 h-5" />
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-4 overflow-y-auto">
        <slot />
      </div>

      <!-- Footer -->
      <div v-if="$slots.footer" class="px-6 py-4 bg-background-200 border-t border-gray-400 flex items-center justify-end gap-3">
        <slot name="footer" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  title: { type: String, required: true },
  closeOnOutsideClick: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue'])

const onKeydown = (e: KeyboardEvent) => {
  if (e.key === 'Escape' && props.modelValue) {
    emit('update:modelValue', false)
  }
}

watch(() => props.modelValue, (val) => {
  if (val) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
})

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>
