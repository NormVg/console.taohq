<template>
  <div>Redirecting...</div>
</template>

<script setup>
import { navigateTo } from '#app'

definePageMeta({
  layout: 'dashboard',
  middleware: [
    function (to, from) {
      return navigateTo('/cms')
    }
  ]
})
</script>
