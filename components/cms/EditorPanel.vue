<template>
  <div class="h-full flex flex-col">
    <!-- Action bar -->
    <div class="action-bar">
      <div class="action-bar-left">
        <span class="action-bar-title" :title="isCreating ? 'New Entry' : `Edit — ${form.title || 'Untitled'}`">
          {{ isCreating ? 'New Entry' : `Edit — ${form.title || 'Untitled'}` }}
        </span>
      </div>

      <div class="tab-toggle">
        <button
          :class="['tab-btn', { active: activeTab === 'edit' }]"
          @click="activeTab = 'edit'"
        >
          Edit
        </button>
        <button
          :class="['tab-btn', { active: activeTab === 'api' }]"
          @click="activeTab = 'api'"
          :disabled="isCreating"
        >
          API
        </button>
      </div>

      <div class="action-bar-right">
        <GeistButton
          v-if="!isCreating"
          variant="error"
          size="sm"
          @click="deleteEntry"
        >
          <Icon name="lucide:trash-2" class="w-3.5 h-3.5 mr-1" />
          Delete
        </GeistButton>
        <GeistButton
          size="sm"
          :loading="saving"
          @click="saveEntry"
        >
          {{ isCreating ? 'Create' : 'Save' }}
        </GeistButton>
      </div>
    </div>

    <div class="detail-body">
      <!-- Edit tab -->
      <div v-if="activeTab === 'edit'" class="form-body">
        <div class="form-grid-2">
          <GeistInput v-model="form.title" label="Title" placeholder="e.g. Getting Started" />
          <GeistInput v-model="form.slug" label="Slug" placeholder="e.g. getting-started" />
        </div>
        <p class="slug-hint">Route: /api/content/{{ form.slug || '…' }}</p>

        <!-- Format selector -->
        <div class="field-group">
          <label class="field-label">Format</label>
          <div class="segmented-control">
            <button
              v-for="fmt in formats"
              :key="fmt.value"
              :class="['segment-btn', { active: form.type === fmt.value }]"
              @click="form.type = fmt.value"
            >
              <Icon :name="fmt.icon" class="w-3.5 h-3.5" />
              {{ fmt.label }}
            </button>
          </div>
        </div>

        <!-- Published toggle row -->
        <div class="publish-row">
          <label class="toggle-label">
            <button
              type="button"
              role="switch"
              :aria-checked="form.published"
              :class="['toggle-switch', { on: form.published }]"
              @click="form.published = !form.published"
            >
              <span class="toggle-thumb" />
            </button>
            <span class="text-[14px] font-medium text-secondary">
              {{ form.published ? 'Live / Published' : 'Draft' }}
            </span>
          </label>

          <div v-if="!isCreating" class="publish-actions">
            <GeistButton
              variant="tertiary"
              size="sm"
              @click="openUrl(`/api/content/${form.slug}`)"
            >
              <Icon name="lucide:external-link" class="w-3.5 h-3.5 mr-1" />
              Open API
            </GeistButton>
            <GeistButton variant="tertiary" size="sm" @click="copyLink">
              <Icon :name="copied ? 'lucide:check' : 'lucide:copy'" class="w-3.5 h-3.5 mr-1" />
              {{ copied ? 'Copied' : 'Copy Link' }}
            </GeistButton>
          </div>
        </div>

        <!-- Editor -->
        <GeistEditor
          v-model="form.body"
          label="Body"
          :language="form.type === 'json' ? 'json' : form.type === 'markdown' ? 'markdown' : 'text'"
          min-height="300px"
        />
      </div>

      <!-- API tab -->
      <div v-if="activeTab === 'api' && !isCreating" class="form-body">
        <div class="api-section">
          <h3 class="api-heading">Endpoint</h3>
          <div class="api-card">
            <span class="api-method">GET</span>
            <code class="api-url">/api/content/{{ form.slug }}</code>
          </div>
        </div>

        <div class="api-section">
          <h3 class="api-heading">cURL</h3>
          <div class="api-code-block">
            <pre><code>curl {{ baseUrl }}/api/content/{{ form.slug }}</code></pre>
          </div>
        </div>

        <div class="api-section">
          <h3 class="api-heading">Response</h3>
          <div class="api-code-block">
            <pre><code>{
  "id": "{{ entry?.id }}",
  "title": "{{ form.title }}",
  "slug": "{{ form.slug }}",
  "type": "{{ form.type }}",
  "body": "…",
  "published": {{ form.published }},
  "createdAt": "{{ entry?.createdAt }}"
}</code></pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'

const props = defineProps<{
  entry?: any
  isCreating: boolean
  saving: boolean
  baseUrl: string
}>()

const emit = defineEmits<{
  (e: 'save', formData: any): void
  (e: 'delete'): void
}>()

const activeTab = ref<'edit' | 'api'>('edit')
const copied = ref(false)

const form = ref({
  title: '',
  slug: '',
  type: 'markdown',
  body: '',
  published: true,
})

const formats = [
  { label: 'Text', value: 'text', icon: 'lucide:file-text' },
  { label: 'Markdown', value: 'markdown', icon: 'lucide:file-code' },
  { label: 'JSON', value: 'json', icon: 'lucide:braces' },
]

watch(() => props.entry, (newEntry) => {
  if (props.isCreating) {
    form.value = { title: '', slug: '', type: 'markdown', body: '', published: true }
    activeTab.value = 'edit'
  } else if (newEntry) {
    form.value = {
      title: newEntry.title ?? '',
      slug: newEntry.slug ?? '',
      type: newEntry.type ?? 'markdown',
      body: newEntry.body ?? '',
      published: newEntry.published ?? true,
    }
  }
}, { immediate: true })

watch(() => props.isCreating, (creating) => {
  if (creating) {
    form.value = { title: '', slug: '', type: 'markdown', body: '', published: true }
    activeTab.value = 'edit'
  }
})

function saveEntry() {
  emit('save', form.value)
}

function deleteEntry() {
  emit('delete')
}

async function copyLink() {
  if (!form.value.slug) return
  const url = `${window.location.origin}/api/content/${form.value.slug}`
  try {
    await navigator.clipboard.writeText(url)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch (e) {
    console.error('Copy failed:', e)
  }
}

function openUrl(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped>
.action-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-default);
  background: var(--bg-surface);
}

.action-bar-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.action-bar-title {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.action-bar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: flex-end;
}

.tab-toggle {
  display: flex;
  background: var(--bg-surface-2);
  padding: 3px;
  border-radius: 6px;
  border: 1px solid var(--border-default);
  gap: 2px;
}

.tab-btn {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 150ms ease;
}

.tab-btn:hover:not(:disabled) {
  color: var(--text-primary);
}

.tab-btn.active {
  background: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px var(--border-default);
}

.tab-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.detail-body {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.form-body {
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.slug-hint {
  font-size: 12px;
  color: var(--text-secondary);
  font-family: monospace;
  margin-top: -16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.segmented-control {
  display: inline-flex;
  background: var(--bg-surface-2);
  padding: 4px;
  border-radius: 8px;
  border: 1px solid var(--border-default);
  gap: 4px;
}

.segment-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  background: transparent;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 150ms ease;
}

.segment-btn:hover {
  color: var(--text-primary);
}

.segment-btn.active {
  background: var(--bg-surface);
  color: var(--text-primary);
  box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 0 0 1px var(--border-default);
}

.publish-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: 8px;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
}

.toggle-switch {
  width: 40px;
  height: 24px;
  background: var(--text-tertiary);
  border-radius: 12px;
  border: none;
  position: relative;
  transition: background 200ms ease;
  cursor: pointer;
  padding: 0;
}

.toggle-switch.on {
  background: var(--bg-success);
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle-switch.on .toggle-thumb {
  transform: translateX(16px);
}

.publish-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-default);
}

.api-section:last-child {
  border-bottom: none;
}

.api-heading {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.api-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: 8px;
}

.api-method {
  font-size: 12px;
  font-weight: 700;
  color: var(--bg-success);
}

.api-url {
  font-size: 13px;
  color: var(--text-primary);
  font-family: monospace;
}

.api-code-block {
  background: var(--bg-root);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 16px;
  overflow-x: auto;
}

.api-code-block pre {
  margin: 0;
}

.api-code-block code {
  font-family: monospace;
  font-size: 13px;
  color: var(--text-secondary);
}
</style>
