export default defineNuxtRouteMiddleware((to) => {
  let authValue: unknown = null

  if (process.client) {
    const match = document.cookie.match(/(?:^|;\s*)console_authenticated=([^;]*)/)
    authValue = match ? match[1] : null
  } else {
    authValue = useCookie('console_authenticated').value
  }

  const isAuthenticated = authValue === true || authValue === 'true' || authValue === '"true"'

  if (to.path === '/login') {
    if (isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  if (!isAuthenticated) {
    return navigateTo('/login')
  }
})
