import { useAuthStore } from '../stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  const authStore = useAuthStore()

  // Always initialize auth state so it's correct on both server and client!
  authStore.initialize()

  // If trying to access any page other than login, check authentication
  if (to.path !== '/login') {
    if (!authStore.isAuthenticated) {
      return navigateTo('/login')
    }
  } else {
    // If trying to access login while already authenticated, redirect to home
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
  }
})

