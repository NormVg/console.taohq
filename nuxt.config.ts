// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

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
