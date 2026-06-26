<template>
  <div class="docs-page">
    <div class="docs-container">
      <div class="docs-header">
        <h1 class="docs-title">Developer Docs</h1>
        <p class="docs-subtitle">Learn how to interact with your Tao Console API.</p>
      </div>

      <div class="docs-content">
        <!-- Authentication Section -->
        <section class="docs-section">
          <h2>Authentication</h2>
          <p>
            Your API provides both public endpoints and protected endpoints. For protected endpoints, you must authenticate using an API Key.
          </p>
          <p>You can pass your API Key in one of two ways:</p>
          
          <div class="auth-methods">
            <div class="method-card">
              <h3>1. HTTP Header (Recommended)</h3>
              <p>Include the <code>x-api-key</code> header in your HTTP requests.</p>
              <div class="code-block">
                <pre><code>curl -H "x-api-key: YOUR_API_KEY" \
  {{ baseUrl }}/api/cdn/assets/protected-image.jpg</code></pre>
              </div>
            </div>

            <div class="method-card">
              <h3>2. URL Parameter</h3>
              <p>Append the <code>?key=YOUR_API_KEY</code> parameter to the URL. Useful for direct browser links or HTML embeds.</p>
              <div class="code-block">
                <pre><code>&lt;img src="{{ baseUrl }}/api/cdn/assets/protected-image.jpg?key=YOUR_API_KEY" /&gt;</code></pre>
              </div>
            </div>
          </div>
        </section>

        <!-- CMS API Section -->
        <section class="docs-section">
          <h2>CMS API (Content)</h2>
          <p>
            The CMS API allows you to fetch your content entries. Content APIs are generally public and do not require an API key unless specifically configured.
          </p>
          
          <div class="endpoint">
            <div class="endpoint-header">
              <GeistBadge variant="success">GET</GeistBadge>
              <code>/api/content/:slug</code>
            </div>
            <p>Fetches a specific content entry by its slug.</p>
            <div class="code-block">
              <pre><code>curl {{ baseUrl }}/api/content/privacy-policy</code></pre>
            </div>
          </div>
        </section>

        <!-- CDN API Section -->
        <section class="docs-section">
          <h2>CDN API (Assets)</h2>
          <p>
            The CDN API serves your uploaded files. Assets can be either <strong>Public</strong> or <strong>Protected</strong>.
          </p>
          
          <div class="endpoint">
            <div class="endpoint-header">
              <GeistBadge variant="success">GET</GeistBadge>
              <code>/api/cdn/assets/:key</code>
            </div>
            <p>Fetches a specific asset by its key (path). If the asset is protected, you must include your API key.</p>
            <div class="code-block">
              <pre><code># Public asset
curl -O {{ baseUrl }}/api/cdn/assets/logo.png

# Protected asset
curl -H "x-api-key: YOUR_API_KEY" -O {{ baseUrl }}/api/cdn/assets/private-doc.pdf</code></pre>
            </div>
          </div>
        </section>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

import { computed } from 'vue'

const baseUrl = computed(() => {
  if (import.meta.client) return window.location.origin
  return 'https://your-domain.com'
})
</script>

<style scoped>
.docs-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  background: var(--bg-root);
}

.docs-container {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
  padding: 40px 32px;
}

.docs-header {
  margin-bottom: 40px;
}

.docs-title {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.03em;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.docs-subtitle {
  font-size: 15px;
  color: var(--text-secondary);
}

.docs-content {
  display: flex;
  flex-direction: column;
  gap: 48px;
}

.docs-section h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-default);
}

.docs-section p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 16px;
}

.auth-methods {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: 24px;
}

.method-card {
  background: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 20px;
}

.method-card h3 {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.method-card p {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.endpoint {
  background: var(--bg-surface-1);
  border: 1px solid var(--border-default);
  border-radius: 8px;
  padding: 20px;
  margin-top: 16px;
}

.endpoint-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.endpoint-header code {
  font-family: 'Geist Mono', monospace;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.code-block {
  background: var(--bg-surface-2);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 16px;
  overflow-x: auto;
}

.code-block pre {
  margin: 0;
}

.code-block code {
  font-family: 'Geist Mono', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-primary);
  white-space: pre;
}
</style>
