<template>
  <div class="category-tree">
    <div class="tree-header">
      <span class="header-label">Categories</span>
      <button class="header-action" @click="addRootCategory" aria-label="Add Category">
        <Plus :size="14" :stroke-width="1.5" />
      </button>
    </div>

    <div class="tree-list">
      <NuxtLink to="/dashboard/loops" class="row">
        <Repeat :size="12" :stroke-width="1.5" class="row-icon" />
        <span class="row-label" :class="{ 'is-active': $route.path === '/dashboard/loops' }">Loops</span>
      </NuxtLink>

      <CategoryNode 
        v-for="category in visibleCategories" 
        :key="category.id" 
        :category="category" 
        :depth="0" 
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Plus, Repeat } from '@lucide/vue'
import { useRoute } from 'vue-router'
import { useCategoryStore } from '~/stores/category.store'
import { useWorkspaceStore } from '~/stores/workspace.store'
import { useUIStore } from '~/stores/ui.store'
import CategoryNode from './CategoryNode.vue'

const categoryStore = useCategoryStore()
const workspaceStore = useWorkspaceStore()
const uiStore = useUIStore()
const $route = useRoute()

const visibleCategories = computed(() => {
  if (workspaceStore.activeWorkspaceId === 'all') {
    return categoryStore.categories
  }
  return categoryStore.categories.filter(c => 
    !c.workspaceId || c.workspaceId === workspaceStore.activeWorkspaceId
  )
})

async function addRootCategory() {
  const name = await uiStore.promptUser('Category Name')
  if (name) {
    categoryStore.addCategory(null, name, workspaceStore.activeWorkspaceId === 'all' ? undefined : workspaceStore.activeWorkspaceId)
  }
}
</script>

<style scoped>
.category-tree {
  display: flex;
  flex-direction: column;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
}

.header-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-action {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-micro);
  transition: all 120ms ease;
}

.header-action:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.tree-list {
  display: flex;
  flex-direction: column;
}

.row {
  display: flex;
  align-items: center;
  height: 30px;
  padding-left: 12px;
  padding-right: var(--space-2);
  cursor: pointer;
  text-decoration: none;
  transition: background-color 150ms ease;
}

.row:hover {
  background-color: var(--bg-surface-2);
}

.row-icon {
  color: var(--text-muted);
  margin-right: 8px;
}

.row-label {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: color 150ms ease;
}

.row:hover .row-label {
  color: var(--text-primary);
}

.row-label.is-active {
  color: var(--text-primary);
  font-weight: 600;
}
</style>
