// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@thenormvg/maya-ui'],
  pinia: {
    storesDirs: ['./app/stores/**']
  },
  build: {
    transpile: ['@thenormvg/maya-ui']
  },
  vite: {
    optimizeDeps: {
      include: ['@thenormvg/maya-ui'],
      exclude: ['lucide-vue-next']
    }
  },
  nitro: {
    serverAssets: [{ baseName: 'db-migrations', dir: 'server/db/migrations' }]
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    bucket0ApiKey: process.env.BUCKET0_API_KEY || '',
    public: {
      adminUsername: process.env.ADMIN_USERNAME || 'admin',
      adminPassword: process.env.ADMIN_PASSWORD || 'admin'
    }
  }
})
