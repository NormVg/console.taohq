import { defineStore } from 'pinia'

export interface CdnAsset {
  id: string
  key: string
  fileName: string
  mimeType: string
  size: number
  access: 'public' | 'api_key'
  bucketKey: string
  destination: string
  createdAt: string
  updatedAt: string
  publicUrl: string
  private: boolean
}

export const useCdnStore = defineStore('cdn', {
  state: () => ({
    assets: [] as CdnAsset[],
    loading: false,
    uploading: false,
    error: null as string | null
  }),

  actions: {
    async fetchAssets() {
      this.loading = true
      this.error = null
      try {
        this.assets = await $fetch<CdnAsset[]>('/api/cdn/assets')
      } catch (err: any) {
        this.error = err.message || 'Failed to fetch CDN assets'
        throw err
      } finally {
        this.loading = false
      }
    },

    async uploadAsset(file: File, options: { path?: string; access: 'public' | 'api_key' }) {
      this.uploading = true
      this.error = null
      try {
        const form = new FormData()
        form.append('file', file)
        if (options.path?.trim()) {
          form.append('path', options.path.trim())
        }
        form.append('access', options.access)

        const asset = await $fetch<CdnAsset>('/api/cdn/assets', {
          method: 'POST',
          body: form
        })

        const existing = this.assets.findIndex(a => a.key === asset.key)
        if (existing >= 0) {
          this.assets.splice(existing, 1, asset)
        } else {
          this.assets.unshift(asset)
        }

        return asset
      } catch (err: any) {
        this.error = err.message || 'Failed to upload asset'
        throw err
      } finally {
        this.uploading = false
      }
    },

    async deleteAsset(key: string) {
      this.error = null
      try {
        await $fetch(`/api/cdn/assets/${key}`, { method: 'DELETE' })
        this.assets = this.assets.filter(a => a.key !== key)
      } catch (err: any) {
        this.error = err.message || 'Failed to delete asset'
        throw err
      }
    }
  }
})
