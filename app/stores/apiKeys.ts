import { defineStore } from 'pinia'

export interface ApiKey {
  id: string
  name: string
  prefix: string
  lastUsedAt: string | null
  createdAt: string
  revoked: boolean
}

export const useApiKeysStore = defineStore('apiKeys', {
  state: () => ({
    keys: [] as ApiKey[],
    loading: false,
    error: null as string | null
  }),

  actions: {
    async fetchKeys() {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<ApiKey[]>('/api/keys')
        this.keys = response
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch API keys'
      } finally {
        this.loading = false
      }
    },

    async createKey(name: string) {
      this.loading = true
      this.error = null
      try {
        const response = await $fetch<{ fullKey: string; prefix: string; name: string }>('/api/keys', {
          method: 'POST',
          body: { name }
        })
        // Refresh keys to make sure prefix key is in state
        await this.fetchKeys()
        return response
      } catch (err: any) {
        this.error = err.message || 'Failed to create API key'
        throw err
      } finally {
        this.loading = false
      }
    },

    async revokeKey(id: string) {
      this.loading = true
      this.error = null
      try {
        await $fetch(`/api/keys/${id}`, {
          method: 'DELETE'
        })
        this.keys = this.keys.filter(k => k.id !== id)
      } catch (err: any) {
        this.error = err.message || 'Failed to revoke API key'
        throw err
      } finally {
        this.loading = false
      }
    }
  }
})
