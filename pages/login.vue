<template>
  <div class="w-full max-w-[380px] bg-background-100 border border-gray-400 rounded-md shadow-card p-6 sm:p-8">
    <div class="mb-8 flex flex-col items-center">
      <h1 class="text-[24px] font-semibold text-primary tracking-tight">Log in to Console</h1>
      <p class="text-[14px] text-secondary mt-2">Enter your admin credentials</p>
    </div>

    <form @submit.prevent="login" class="space-y-4">
      <GeistInput
        v-model="username"
        label="Username"
        id="username"
        placeholder="admin"
        :error="errorMsg"
      />
      <GeistInput
        v-model="password"
        type="password"
        label="Password"
        id="password"
        placeholder="••••••••"
      />
      
      <div class="pt-4">
        <GeistButton
          type="submit"
          class="w-full"
          :loading="loading"
        >
          Log In
        </GeistButton>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const username = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const login = async () => {
  errorMsg.value = ''
  if (!username.value || !password.value) {
    errorMsg.value = 'Please enter both username and password'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { username: username.value, password: password.value }
    })
    window.location.href = '/cms'
  } catch (e: any) {
    errorMsg.value = e.data?.message || 'Invalid credentials'
  } finally {
    loading.value = false
  }
}
</script>
