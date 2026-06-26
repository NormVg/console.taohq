<template>
  <div class="keys-page">
    <!-- Header -->
    <div class="page-header">
      <div>
        <h1 class="page-title">API Keys</h1>
        <p class="page-subtitle">Manage authentication keys for your API endpoints.</p>
      </div>
      <GeistButton @click="showCreateModal = true" size="sm">
        <Icon name="lucide:plus" class="w-4 h-4 mr-1.5" />
        Create Key
      </GeistButton>
    </div>

    <!-- Quick Reference -->
    <div class="auth-hint">
      <div class="auth-hint-header">
        <Icon name="lucide:terminal" class="w-4 h-4 text-secondary" />
        <span class="text-[13px] font-medium text-primary">Authentication Header</span>
      </div>
      <code class="auth-hint-code">x-api-key: YOUR_API_KEY</code>
    </div>

    <!-- Keys List -->
    <div class="keys-table-wrapper">
      <table class="keys-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Key Prefix</th>
            <th>Created</th>
            <th>Last Used</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="pending">
            <td colspan="5" class="py-16 text-center text-[14px] text-secondary">
              <Icon name="lucide:loader-2" class="w-5 h-5 mx-auto mb-2 animate-spin text-secondary" />
              Loading keys...
            </td>
          </tr>
          <tr v-else-if="!keys?.length">
            <td colspan="5" class="py-16 text-center">
              <div class="flex flex-col items-center gap-2">
                <Icon name="lucide:key" class="w-6 h-6 text-secondary" />
                <p class="text-[14px] text-secondary">No API keys yet</p>
                <GeistButton size="sm" variant="secondary" @click="showCreateModal = true">Create your first key</GeistButton>
              </div>
            </td>
          </tr>
          <tr v-for="key in keys" :key="key.id" class="group">
            <td>
              <div class="flex items-center gap-2">
                <span class="font-medium text-primary">{{ key.name }}</span>
                <GeistBadge v-if="key.revoked" variant="error">Revoked</GeistBadge>
              </div>
            </td>
            <td>
              <code class="text-[13px] font-mono text-secondary">{{ key.prefix }}<span class="text-gray-700">••••••••</span></code>
            </td>
            <td class="text-secondary">{{ formatDate(key.createdAt) }}</td>
            <td class="text-secondary">{{ key.lastUsedAt ? formatDate(key.lastUsedAt) : 'Never' }}</td>
            <td class="text-right">
              <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                <button v-if="!key.revoked" @click="revokeKey(key.id)" class="revoke-btn">
                  Revoke
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Create Modal -->
    <GeistModal v-model="showCreateModal" title="Create API Key" :closeOnOutsideClick="!newKeyResult">
      <div v-if="!newKeyResult">
        <p class="text-[14px] text-secondary mb-4">API keys authenticate requests to your console's public endpoints.</p>
        <form @submit.prevent="createKey">
          <GeistInput v-model="newKeyName" label="Key Name" placeholder="e.g. Production App" required autofocus />
        </form>
      </div>
      <div v-else class="space-y-4">
        <div class="warning-box">
          <Icon name="lucide:alert-triangle" class="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>Copy this key now. It will not be shown again.</p>
        </div>
        <CopyableText :text="newKeyResult.fullKey" />
      </div>

      <template #footer>
        <template v-if="!newKeyResult">
          <GeistButton variant="secondary" @click="showCreateModal = false">Cancel</GeistButton>
          <GeistButton @click="createKey" :loading="creating">Create</GeistButton>
        </template>
        <template v-else>
          <GeistButton @click="closeModalAndRefresh">Done</GeistButton>
        </template>
      </template>
    </GeistModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

import { ref } from 'vue'
import { format } from 'date-fns'

const { data: keys, pending, refresh } = useFetch('/api/keys')

const showCreateModal = ref(false)
const newKeyName = ref('')
const newKeyResult = ref<any>(null)
const creating = ref(false)

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return format(new Date(dateStr), 'MMM d, yyyy')
}

const createKey = async () => {
  if (!newKeyName.value.trim()) return
  creating.value = true
  try {
    const res = await $fetch('/api/keys', {
      method: 'POST',
      body: { name: newKeyName.value }
    })
    newKeyResult.value = res
  } catch (e) {
    alert('Failed to create key')
    console.error(e)
  } finally {
    creating.value = false
  }
}

const closeModalAndRefresh = () => {
  showCreateModal.value = false
  newKeyName.value = ''
  newKeyResult.value = null
  refresh()
}

const revokeKey = async (id: string) => {
  if (!confirm('Revoke this key? It will instantly stop working.')) return
  try {
    await $fetch(`/api/keys/${id}`, { method: 'DELETE' })
    refresh()
  } catch (e) {
    alert('Failed to revoke key')
  }
}
</script>

<style scoped>
.keys-page {
  padding: var(--space-6) var(--space-8);
  max-width: 960px;
  margin: 0 auto;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: var(--space-6);
}
.page-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--text-primary);
}
.page-subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.auth-hint {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: var(--radius-medium);
  margin-bottom: var(--space-6);
}
.auth-hint-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  flex-shrink: 0;
}
.auth-hint-code {
  font-family: 'Geist Mono', monospace;
  font-size: 13px;
  color: var(--text-primary);
  background: var(--bg-surface-2);
  padding: 4px 10px;
  border-radius: var(--radius-micro);
  border: 1px solid var(--border-default);
}

.keys-table-wrapper {
  border: 1px solid var(--border-default);
  border-radius: var(--radius-medium);
  overflow: hidden;
}
.keys-table {
  width: 100%;
  text-align: left;
  font-size: 14px;
  border-collapse: collapse;
}
.keys-table thead tr {
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-surface-1);
}
.keys-table th {
  padding: 10px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.keys-table tbody tr {
  border-bottom: 1px solid var(--border-default);
  transition: background-color 150ms ease;
}
.keys-table tbody tr:last-child {
  border-bottom: none;
}
.keys-table tbody tr:hover {
  background-color: var(--bg-hover);
}
.keys-table td {
  padding: 12px 16px;
  font-size: 14px;
}

.revoke-btn {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-danger-text);
  background: var(--color-danger-bg-muted);
  border: 1px solid var(--color-danger-border);
  padding: 4px 12px;
  border-radius: var(--radius-micro);
  cursor: pointer;
  transition: all 150ms ease;
  font-family: inherit;
}
.revoke-btn:hover {
  background: var(--color-danger-base);
  color: white;
  border-color: var(--color-danger-base);
}
.revoke-btn:active {
  transform: scale(0.98);
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: var(--space-2);
  padding: var(--space-3);
  background: var(--color-warning-bg-muted);
  border: 1px solid var(--color-warning-border);
  border-radius: var(--radius-micro);
  font-size: 14px;
  color: var(--color-warning-text);
}
</style>
