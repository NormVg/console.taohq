<script setup>
import { ref } from 'vue'
import { LockIcon, ShieldCheckIcon, AlertTriangleIcon, LogInIcon } from 'lucide-vue-next'
import { useAuthStore } from '../stores/auth'

const username = ref('')
const password = ref('')
const loading = ref(false)
const showError = ref(false)
const errorMessage = ref('')

const authStore = useAuthStore()
const { toast } = useToast()

const handleLogin = async () => {
  if (!username.value || !password.value) {
    showError.value = true
    errorMessage.value = 'Please enter both username and password.'
    return
  }

  loading.value = true
  showError.value = false

  // Smooth loading simulation for premium feedback
  await new Promise(resolve => setTimeout(resolve, 500))

  const success = authStore.authenticate(username.value, password.value)

  if (success) {
    toast({
      title: 'Success',
      description: 'Authorized session active.',
      intent: 'success',
      duration: 2500
    })
    navigateTo('/')
  } else {
    loading.value = false
    showError.value = true
    errorMessage.value = 'Invalid credentials.'
    toast({
      title: 'Access Denied',
      description: 'The admin credentials entered are invalid.',
      intent: 'danger',
      duration: 3500
    })
  }
}
</script>

<template>
  <div class="login-container">
    <!-- Clean Minimal Header -->
    <header class="login-header">
      <div class="logo-area">
        <ShieldCheckIcon class="logo-icon" />
        <span class="logo-text">console.taohq</span>
      </div>
      <MayaThemeToggle />
    </header>

    <!-- Centered flat login card -->
    <main class="login-main">
      <MayaCard class="login-card" :bordered="true">
        <template #header>
          <div class="card-header-content">
            <div class="icon-frame">
              <LockIcon class="header-icon" />
            </div>
            <h1 class="card-title">Console Sign In</h1>
            <p class="card-subtitle">Authorize admin session to continue</p>
          </div>
        </template>

        <div class="card-body-content">
          <!-- Error alert stack -->
          <Transition name="fade">
            <div v-if="showError" style="margin-bottom: 16px;">
              <MayaAlert intent="danger" title="Access Denied" :icon="AlertTriangleIcon">
                {{ errorMessage }}
              </MayaAlert>
            </div>
          </Transition>

          <!-- Input fields -->
          <div class="form-fields">
            <div class="input-wrapper">
              <MayaInput
                v-model="username"
                label="Username"
                placeholder="admin"
                :disabled="loading"
                autocomplete="username"
              />
            </div>
            <div class="input-wrapper">
              <MayaInput
                v-model="password"
                label="Password"
                type="password"
                placeholder="••••••••••••"
                :disabled="loading"
                autocomplete="current-password"
                @keyup.enter="handleLogin"
              />
            </div>
          </div>
        </div>

        <template #footer>
          <div class="card-footer-content">
            <MayaBtn
              style="width: 100%; display: flex; justify-content: center; align-items: center; gap: 8px;"
              :disabled="loading"
              intent="default"
              @click="handleLogin"
            >
              <MayaSpinner v-if="loading" size="sm" />
              <LogInIcon v-else style="width: 14px; height: 14px;" />
              {{ loading ? 'Signing In...' : 'Sign In' }}
            </MayaBtn>
            <p class="secure-label">
              Secure administrative terminal
            </p>
          </div>
        </template>
      </MayaCard>
    </main>
  </div>
</template>

<style scoped>
/* Solid clean modern flat layout */
.login-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--maya-bg-root);
  color: var(--maya-text-primary);
  transition: background-color var(--maya-duration) ease, color var(--maya-duration) ease;
  font-family: var(--maya-font-sans);
}

/* Header style containing logo and theme switch */
.login-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 52px;
  padding: 0 24px;
  border-bottom: 1px dashed var(--maya-border);
  z-index: 10;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-icon {
  width: 20px;
  height: 20px;
  color: var(--maya-text-primary);
}

.logo-text {
  font-size: 0.9375rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--maya-text-primary);
}

/* Centering main wrapper */
.login-main {
  position: relative;
  z-index: 5;
  width: 100%;
  max-width: 400px;
  padding: 20px;
}

.login-card {
  width: 100%;
}

/* Header style within the card */
.card-header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 8px;
}

.icon-frame {
  width: 42px;
  height: 42px;
  border-radius: var(--maya-radius-md);
  background: var(--maya-bg-surface);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  border: 1px solid var(--maya-border);
}

.header-icon {
  width: 18px;
  height: 18px;
  color: var(--maya-text-primary);
}

.card-title {
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.03em;
  color: var(--maya-text-primary);
  margin: 0 0 6px 0;
}

.card-subtitle {
  font-size: 0.8125rem;
  color: var(--maya-text-secondary);
  margin: 0;
}

/* Card Body spacing and styling */
.card-body-content {
  padding: 4px 0;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
}

/* Footer layout inside the card */
.card-footer-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding-bottom: 4px;
}

.secure-label {
  font-size: 0.6875rem;
  font-weight: 500;
  color: var(--maya-text-muted);
  margin: 0;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

/* Animations transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
