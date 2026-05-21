import { defineStore } from 'pinia'

export interface CmsEntry {
  id: string
  slug: string
  title: string
  type: 'text' | 'markdown' | 'json'
  body: string
  published: boolean
  createdAt: string
  updatedAt: string
}

export const useCmsStore = defineStore('cms', {
  state: () => ({
    entries: [] as CmsEntry[],
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchEntries() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<CmsEntry[]>('/api/cms')
        this.entries = response
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch CMS entries'
      } finally {
        this.loading = false
      }
    },

    async createEntry(payload: Omit<CmsEntry, 'id' | 'createdAt' | 'updatedAt'>) {
      this.loading = true
      this.error = null
      try {
        const newEntry = await $fetch<CmsEntry>('/api/cms', {
          method: 'POST',
          body: payload
        })
        this.entries.unshift(newEntry)
        return newEntry
      } catch (err: any) {
        this.error = err.message || 'Failed to create entry'
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateEntry(id: string, payload: Partial<CmsEntry>) {
      this.loading = true
      this.error = null
      try {
        const updated = await $fetch<CmsEntry>(`/api/cms/${id}`, {
          method: 'PUT',
          body: payload
        })
        const index = this.entries.findIndex(e => e.id === id)
        if (index !== -1) {
          this.entries[index] = updated
        }
        return updated
      } catch (err: any) {
        this.error = err.message || 'Failed to update entry'
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteEntry(id: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/cms/${id}`, {
          method: 'DELETE'
        })
        this.entries = this.entries.filter(e => e.id !== id)
      } catch (err: any) {
        this.error = err.message || 'Failed to delete entry'
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
