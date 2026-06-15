# Maya UI Source Architecture

Use this reference before copying Maya source into a user project. The goal is to preserve the original component behavior while fitting the target project's folder conventions.

## Project Inspection

Before writing files, inspect:

1. Framework: Nuxt, Vue + Vite, or another Vue setup.
2. Component directory conventions: `components/`, `app/components/`, feature folders, or library folders.
3. CSS entrypoints: `assets/css`, `app/assets/css`, `app.vue`, `main.ts`, or `nuxt.config.ts`.
4. Existing icon, animation, sound, and utility dependencies.
5. TypeScript support and strictness.
6. Existing theme system and whether it already uses `data-theme`, CSS variables, or a store.

## Default Placement

Use the project's established convention first. If none exists, use this layout:

```text
components/
  maya/
    Btn.vue
    Dialog.vue
    Toaster.vue
composables/
  maya/
    useMayaSound.ts
    useMayaTheme.ts
    useToast.ts
assets/
  css/
    maya.css
```

For Nuxt 4 app-directory projects, prefer:

```text
app/
  components/
    maya/
  composables/
    maya/
  assets/
    css/
      maya.css
```

## CSS Wiring

Load `maya.css` once globally.

Nuxt:

```ts
export default defineNuxtConfig({
  css: ['~/assets/css/maya.css'],
})
```

Vue + Vite:

```ts
import './assets/css/maya.css'
```

Do not import `maya.css` inside every component. That duplicates work and makes overrides harder to reason about.

## Dependency Handling

Read `references/source-map.md` before copying. Each component row lists local runtime imports.

When a component imports a local dependency:

1. Copy the dependency into the matching target folder.
2. Update relative import paths.
3. Remove a dependency only when the user asked for a lighter version or the target project cannot support it.
4. If you remove a dependency, replace the behavior explicitly. Do not leave dead imports or silent missing behavior.

Common dependency patterns:

| Pattern | Action |
|---|---|
| `../composables/useMayaSound` | Copy `useMayaSound` or remove sound calls cleanly. |
| `../composables/useToast` | Copy `useToast` and include one root `Toaster`. |
| Child component import | Copy the child component into the same namespace and update paths. |
| `lucide-vue-next` import | Use the project's icon library if it already has one; otherwise keep Lucide if installed or add the dependency with user approval when appropriate. |
| `three` or media-heavy dependencies | Copy only for components that genuinely need them. |

## Naming

Preserve component names when possible. If the target project already has a conflicting name, prefix copied files with `Maya`, such as `MayaButton.vue`, and update references consistently.

Use one namespace per project. Do not scatter Maya components across unrelated feature folders unless the user explicitly wants feature-local copies.

## Root-Level Singletons

These should exist once at the app root:

| Feature | Root placement |
|---|---|
| Toasts | One `Toaster` next to the app shell or root layout. |
| Dialog/modal portals | Root-level teleport target or overlay container. |
| Theme state | One `useMayaTheme` owner or one shared document-level theme attribute. |
| Sound preferences | One composable-backed preference, not per-button state. |

## Adaptation Checklist

Before finishing:

1. Imports resolve.
2. Global CSS is loaded once.
3. Components render in both light and dark theme if the project supports both.
4. Focus states are visible.
5. Interactive hit targets remain at least 40px by 40px.
6. Motion uses Maya variables and respects reduced motion where relevant.
7. Root-level components are not duplicated inside repeated children.
