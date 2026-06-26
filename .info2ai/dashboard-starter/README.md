# Modular Dashboard Starter Kit

This is a highly optimized, modular dashboard template built with Nuxt 4, Vue 3, and Pinia. It contains our premium UI layout including a collapsible sidebar, a theme switcher, a workspace switcher, and an empty page area ready for your application.

## Prerequisites

- Node.js >= 20.x
- npm, pnpm, or bun

## Setup

1. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser to `http://localhost:3000/dashboard` (or `http://localhost:3000`).

## Architecture

- `app/layouts/dashboard.vue`: The main layout wrapper that handles layout shifts.
- `app/components/layout/`: Contains the Sidebar, Workspace Switcher, and Nav items.
- `app/assets/css/main.css`: Contains all of the CSS tokens, dark mode colors, and micro-animations.
- `app/stores/`: Pinia stores for UI state (`isSidebarCollapsed`), simplified workspace and category state.

## Customization

To build out your dashboard, start by adding new pages in `app/pages/dashboard/`. Any page that includes `definePageMeta({ layout: 'dashboard' })` will automatically inherit the sidebar and layout wrapper.
