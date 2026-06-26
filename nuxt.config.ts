// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/icon',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@nuxtjs/color-mode',
    'nitro-cloudflare-dev',
  ],

  colorMode: {
    classSuffix: '',
  },

  build: {
    transpile: [
      'vue-codemirror',
      '@codemirror/state',
      '@codemirror/view',
      '@codemirror/language',
      '@codemirror/commands',
      '@codemirror/search',
      '@codemirror/autocomplete',
      '@codemirror/lint',
      '@codemirror/lang-json',
      '@codemirror/lang-markdown',
      '@codemirror/lang-xml',
      '@codemirror/theme-one-dark',
    ]
  },

  nitro: {
    preset: "cloudflare_module",
    cloudflare: {
      deployConfig: true,
      nodeCompat: true
    },
    serverAssets: [{ baseName: 'db-migrations', dir: 'server/db/migrations' }],
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL || '',
    bucket0ApiKey: process.env.BUCKET0_API_KEY || '',
    bucket0S3AccessKeyId: process.env.BUCKET0_S3_ACCESS_KEY_ID || '',
    bucket0S3SecretAccessKey: process.env.BUCKET0_S3_SECRET_ACCESS_KEY || '',
    bucket0S3Bucket: process.env.BUCKET0_S3_BUCKET || 'console-assets',
    public: {
      adminUsername: process.env.ADMIN_USERNAME || 'admin',
      adminPassword: process.env.ADMIN_PASSWORD || 'admin',
    },
  },
  css: [
    '@fontsource/geist-sans/index.css',
    '@fontsource/geist-mono/index.css',
    '~/assets/css/main.css',
  ],
  vite: {
    optimizeDeps: {
      include: [
        '@lucide/vue',
        'date-fns',
      ]
    }
  }
})
