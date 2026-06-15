<template>
  <div class="page dashboard-page">
    <header class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <p class="page-description">Welcome to your new modular dashboard UI.</p>
    </header>

    <div class="page-content">
      <div class="dashboard-card">
        <h3>Getting Started</h3>
        <p>This is a blank slate. You can start building your widgets and application features right here!</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })
</script>

<style scoped>
.dashboard-card {
  background: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-large);
  padding: var(--space-6);
  box-shadow: var(--shadow-sm);
}

.dashboard-card h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-2);
}

.dashboard-card p {
  color: var(--text-secondary);
  line-height: 1.5;
}
</style>
