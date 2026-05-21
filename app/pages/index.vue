<script setup>
onMounted(() => {
  navigateTo('/cms')
})
</script>

<template>
  <div class="redirecting">
    <MayaSpinner size="lg" />
    <span class="redirect-text">Loading taohq console...</span>
  </div>
</template>

<style scoped>
.redirecting {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  gap: 16px;
  background-color: var(--maya-bg-root);
  color: var(--maya-text-secondary);
  font-family: var(--maya-font-sans);
}
.redirect-text {
  font-size: 0.875rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}
</style>
