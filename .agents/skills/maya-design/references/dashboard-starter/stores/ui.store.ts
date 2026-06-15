import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', {
  state: () => ({
    isSidebarCollapsed: false,
    activeTaskId: null as string | null,
    isCreateDrawerOpen: false,
    isTaskCreateMode: false,
    taskCreateDefaults: null as { context?: string, status?: string } | null,
    promptConfig: null as { title: string; defaultValue?: string; placeholder?: string } | null,
    promptResolve: null as ((value: string | null) => void) | null,
  }),
  actions: {
    toggleSidebar() {
      this.isSidebarCollapsed = !this.isSidebarCollapsed
    },
    setSidebarCollapsed(value: boolean) {
      this.isSidebarCollapsed = value
    },
    openTaskDrawer(taskId: string) {
      this.isTaskCreateMode = false
      this.taskCreateDefaults = null
      this.activeTaskId = taskId
    },
    openTaskCreateDrawer(defaults?: { context?: string, status?: string }) {
      this.isTaskCreateMode = true
      this.taskCreateDefaults = defaults || null
      this.activeTaskId = 'new'
    },
    closeTaskDrawer() {
      this.activeTaskId = null
      setTimeout(() => {
        this.isTaskCreateMode = false
        this.taskCreateDefaults = null
      }, 300) // wait for animation
    },
    openCreateDrawer() {
      this.isCreateDrawerOpen = true
    },
    closeCreateDrawer() {
      this.isCreateDrawerOpen = false
    },
    promptUser(title: string, placeholder?: string, defaultValue?: string): Promise<string | null> {
      return new Promise((resolve) => {
        this.promptConfig = { title, placeholder, defaultValue }
        this.promptResolve = resolve
      })
    },
    resolvePrompt(value: string | null) {
      if (this.promptResolve) {
        this.promptResolve(value)
      }
      this.promptConfig = null
      this.promptResolve = null
    }
  },
  persist: true
})
