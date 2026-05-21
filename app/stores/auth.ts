import { defineStore } from 'pinia'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    isAuthenticated: false
  }),
  actions: {
    initialize() {
      const authCookie = useCookie('console_authenticated')
      this.isAuthenticated = authCookie.value === 'true'
    },
    authenticate(username, password) {
      const config = useRuntimeConfig()
      const adminUser = config.public.adminUsername
      const adminPass = config.public.adminPassword

      if (username === adminUser && password === adminPass) {
        this.isAuthenticated = true
        const authCookie = useCookie('console_authenticated', { maxAge: 60 * 60 * 24 * 7, path: '/' }) // 1 week
        authCookie.value = 'true'
        return true
      }
      return false
    },
    logout() {
      this.isAuthenticated = false
      const authCookie = useCookie('console_authenticated')
      authCookie.value = null
      navigateTo('/login')
    }
  }
})

