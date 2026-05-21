<script setup>
useHead({
  htmlAttrs: {
    'data-theme': 'dark'
  }
})
</script>

<template>
  <div class="app-root">
    <NuxtRouteAnnouncer />
    <NuxtPage />
    <MayaToaster />
  </div>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  background-color: var(--maya-bg-root);
  color: var(--maya-text-primary);
  font-family: var(--maya-font-sans, system-ui, sans-serif);
}

.app-root {
  height: 100%;
}
</style>
