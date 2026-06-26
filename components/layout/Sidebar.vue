<template>
  <aside
    class="sidebar"
    :class="{ 'is-collapsed': uiStore.isSidebarCollapsed }"
  >
    <!-- Branding + Toggle -->
    <div class="sidebar-header" :class="{ 'is-collapsed': uiStore.isSidebarCollapsed }">
      <img src="~/assets/logo.svg" alt="Tao Logo" class="app-logo-img" :class="{ 'is-collapsed': uiStore.isSidebarCollapsed }" />
      <span class="app-title" :class="{ 'is-collapsed': uiStore.isSidebarCollapsed }">console.taohq</span>
      <Transition name="fade">
        <button
          v-if="!uiStore.isSidebarCollapsed"
          class="collapse-toggle expanded"
          @click="toggle"
          aria-label="Collapse Sidebar"
        >
          <PanelLeftClose :size="16" :stroke-width="1.5" />
        </button>
        <button
          v-else
          class="collapse-toggle collapsed"
          @click="toggle"
          aria-label="Expand Sidebar"
        >
          <PanelLeftOpen :size="16" :stroke-width="1.5" />
        </button>
      </Transition>
    </div>

    <!-- Scrollable Nav -->
    <div class="sidebar-scroll">
      <nav class="nav-section">
        <LayoutSidebarItem
          to="/cms"
          :icon="FileText"
          label="CMS"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />
        <LayoutSidebarItem
          to="/cdn"
          :icon="Image"
          label="CDN Assets"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />
      </nav>
    </div>

    <!-- Footer -->
    <div class="sidebar-footer-container">
      <nav class="nav-section" style="padding: 0 12px 12px;">
        <LayoutSidebarItem
          to="/docs"
          :icon="BookOpen"
          label="Developer Docs"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />
        <LayoutSidebarItem
          to="/keys"
          :icon="Key"
          label="API Keys"
          :isCollapsed="uiStore.isSidebarCollapsed"
        />
      </nav>
      <div class="sidebar-footer">
        <div class="user-row" :class="{ 'is-collapsed': uiStore.isSidebarCollapsed }">
          <button class="logout-btn" @click="logout">
            <LogOut :size="14" :stroke-width="1.5" />
          </button>
          <Transition name="fade">
            <button v-if="!uiStore.isSidebarCollapsed" class="logout-label" @click="logout">Log out</button>
          </Transition>
          <ThemeSwitcher />
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import {
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  FileText,
  Key,
  Image,
  BookOpen,
} from '@lucide/vue'
import { useUIStore } from '~/stores/ui.store'

const uiStore = useUIStore()

function toggle() {
  uiStore.toggleSidebar()
}

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = '/login'
}
</script>

<style scoped>
.sidebar {
  width: 260px;
  height: 100vh;
  background-color: var(--bg-surface-1);
  display: flex;
  flex-direction: column;
  transition: width 260ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: width;
  overflow: hidden;
  flex-shrink: 0;
}
.sidebar.is-collapsed {
  width: 60px;
}

/* ── Header ── */
.sidebar-header {
  height: 64px;
  position: relative;
  flex-shrink: 0;
  transition: height 260ms cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar-header.is-collapsed {
  height: 64px;
}

.app-logo-img {
  position: absolute;
  width: 36px;
  height: 36px;
  left: var(--space-4);
  top: 14px;
  transition: all 260ms cubic-bezier(0.4, 0, 0.2, 1);
  object-fit: contain;
}
.sidebar-header.is-collapsed .app-logo-img {
  left: 12px;
  top: 14px;
}
.sidebar-header.is-collapsed:hover .app-logo-img {
  opacity: 0;
}

.app-title {
  position: absolute;
  left: 64px;
  top: 22px;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: -0.03em;
  white-space: nowrap;
  color: var(--text-primary);
  opacity: 1;
  visibility: visible;
  transition: all 200ms ease;
}
.app-title.is-collapsed {
  opacity: 0;
  visibility: hidden;
  transform: translateX(-10px);
}

.collapse-toggle {
  position: absolute;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-medium);
  transition: background-color 150ms ease, color 150ms ease, opacity 200ms ease;
}
.collapse-toggle.expanded {
  width: 28px;
  height: 28px;
  right: var(--space-4);
  top: 18px;
  opacity: 1;
}
.collapse-toggle.collapsed {
  width: 36px;
  height: 36px;
  left: 12px;
  top: 14px;
  opacity: 0;
}
.sidebar-header.is-collapsed:hover .collapse-toggle.collapsed {
  opacity: 1;
  background-color: var(--bg-hover);
  color: var(--text-primary);
}
.collapse-toggle.expanded:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}
.collapse-toggle:active {
  transform: scale(0.92);
}

/* ── Scrollable ── */
.sidebar-scroll {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
}
.nav-section {
  padding: var(--space-1) var(--space-2);
  display: flex;
  flex-direction: column;
}

/* ── Footer ── */
.sidebar-footer {
  padding: var(--space-3);
  flex-shrink: 0;
}
.user-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: 0 var(--space-1);
  height: 32px;
}
.user-row.is-collapsed {
  justify-content: center;
  padding: 0;
}

.logout-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: var(--radius-full);
  border-radius: var(--radius-medium);
  transition: all 120ms ease;
  flex-shrink: 0;
}
.logout-btn:hover {
  background-color: var(--bg-hover);
  color: var(--text-primary);
}

.logout-label {
  background: none;
  border: none;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  text-align: left;
  font-family: inherit;
}
.logout-label:hover {
  color: var(--text-primary);
}

/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 120ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
