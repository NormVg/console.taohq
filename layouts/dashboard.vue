<template>
  <div class="dashboard-layout">
    <LayoutSidebar />
    <main class="main-content">
      <div class="content-container">
        <slot />
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  background-color: var(--bg-surface-1);
  overflow: hidden;
}
.main-content {
  flex: 1;
  margin: var(--space-2);
  margin-left: 0;
  background-color: var(--bg-root);
  border-radius: var(--radius-xl);
  border: 1px solid var(--border-default);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.content-container {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
</style>
