<script setup lang="ts">
import { markRaw } from 'vue'
import { LayersIcon, KeyIcon, HardDriveIcon, ShieldCheckIcon, LogOutIcon } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

defineProps<{
  pageTitle: string
}>()

const route = useRoute()
const authStore = useAuthStore()
const { toast } = useToast()

const navItems = [
  { to: '/cms', label: 'CMS', icon: markRaw(LayersIcon) },
  { to: '/cdn', label: 'CDN', icon: markRaw(HardDriveIcon) },
  { to: '/api-keys', label: 'API Keys', icon: markRaw(KeyIcon) },
]

const isActive = (path: string) => route.path === path || route.path.startsWith(`${path}/`)

const handleLogout = () => {
  toast({ title: 'Signed out', intent: 'info', duration: 2500 })
  authStore.logout()
}
</script>

<template>
  <MayaAppShell>
    <template #sidebar>
      <MayaSidebar>
        <template #header>
          <div class="console-brand">
            <ShieldCheckIcon class="console-brand-icon" />
            <span class="console-brand-name">console.taohq</span>
          </div>
        </template>

        <MayaNavigationMenu class="console-sidebar-nav">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="console-nav-link"
            :class="{ active: isActive(item.to) }"
          >
            <component :is="item.icon" :size="16" />
            <span>{{ item.label }}</span>
          </NuxtLink>
        </MayaNavigationMenu>

        <template #footer>
          <button type="button" class="console-logout" @click="handleLogout">
            <LogOutIcon class="console-logout-icon" />
            <span>Sign Out</span>
          </button>
        </template>
      </MayaSidebar>
    </template>

    <template #topbar>
      <MayaTopbar>
        <template #left>
          <span class="console-topbar-title">{{ pageTitle }}</span>
        </template>
        <template #right>
          <MayaThemeToggle />
          <MayaAvatar alt="AD" size="sm" />
        </template>
      </MayaTopbar>
    </template>

    <slot />
  </MayaAppShell>
</template>

<style scoped>
.console-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.console-brand-icon {
  width: 18px;
  height: 18px;
  color: var(--maya-text-primary);
}

.console-brand-name {
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--maya-text-primary);
}

.console-sidebar-nav {
  width: 100%;
  margin: 0;
  padding: 0;
}

.console-sidebar-nav :deep(.maya-nav-menu) {
  width: 100%;
  align-items: stretch;
  justify-content: flex-start;
}

.console-sidebar-nav :deep(.maya-nav-list) {
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  width: 100%;
  border: none;
  box-shadow: none;
  background: transparent;
  padding: 0;
  margin: 0;
  gap: 4px;
  list-style: none;
}

.console-sidebar-nav :deep(.console-nav-link) {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  justify-content: flex-start;
  padding: 8px 12px;
  font-size: 0.8125rem;
  text-decoration: none;
}

.console-sidebar-nav :deep(.console-nav-link.active),
.console-sidebar-nav :deep(.console-nav-link.router-link-exact-active) {
  font-weight: 600;
}

.console-logout {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: var(--maya-radius-md);
  background: transparent;
  color: var(--maya-text-muted);
  font-family: var(--maya-font-sans);
  font-size: 0.8125rem;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
}

.console-logout:hover {
  background: color-mix(in srgb, var(--maya-danger) 10%, transparent);
  color: var(--maya-danger);
}

.console-logout-icon {
  width: 14px;
  height: 14px;
}

.console-topbar-title {
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--maya-text-secondary);
}
</style>
