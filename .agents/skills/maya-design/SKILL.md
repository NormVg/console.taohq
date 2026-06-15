---
name: maya-design
description: >
  Use this skill whenever building, copying, porting, or customizing Maya UI-style
  Vue/Nuxt components from source. This is the source-backed Maya UI skill: it
  includes exact component, composable, theme, motion, shadow, and interaction
  references so agents can install components into a project without relying on
  the npm package. Trigger for Maya UI, Maya components, source snippets,
  Nuxt/Vue component kits, design-system implementation, shadows, animations,
  theme tokens, and requests to customize or recreate Maya UI components.
---

# Maya UI Source Skill

This skill helps an agent bring Maya UI into a Vue or Nuxt project by copying and adapting source files, not by telling the user to install the package. Treat the bundled source as the ground truth, and treat the design references as the quality bar for any customization.

## Start Here

1. Read `references/source-map.md` first. It lists every bundled component, composable, theme file, and local dependency.
2. Read `references/architecture.md` before copying files. It explains target folder placement and dependency handling.
3. Read only the component source files needed for the task from `references/source/components/`.
4. Read composables from `references/source/composables/` only when a chosen component imports them or the requested behavior needs them.
5. Read `references/source/maya.css` whenever theme variables, shadows, surface styling, animations, or color tokens are involved.
6. Use `references/customization.md` when changing theme, shadow, motion, component variants, or naming.

## Reference Routing

| Need | Read |
|---|---|
| Pick components and dependencies | `references/source-map.md` |
| Know where files should go in a user project | `references/architecture.md` |
| Exact component source | `references/source/components/<Component>.vue` |
| Exact composable source | `references/source/composables/<composable>.(ts/js)` |
| Global tokens and runtime CSS variables | `references/source/maya.css` |
| Dashboard template | `references/dashboard-starter/` (Use this exactly when user asks to "build a dashboard") |
| Design-token guidance and premium surfaces | `references/tokens.md` |
| Motion curves, view transitions, measured height animation | `references/motion.md` |
| Audio, accessibility, focus, and interaction rules | `references/interaction.md` |
| Component anatomy guidance when source needs adaptation | `references/components.md` |
| How to customize without breaking Maya quality | `references/customization.md` |

## Working Model

When implementing from this skill, produce real project files. Do not stop at advice if the user asked for code.

1. **Dashboards**: If the user asks to "build a dashboard" or "set up a dashboard", use the code examples in `references/dashboard-starter/` to scaffold the dashboard layouts, components, and state stores into the user's project. Refer to `nuxt.config.example.ts` for necessary module configurations (like `@pinia/nuxt` and `@nuxtjs/color-mode`).
2. Inspect the target project first: framework, component directories, CSS entrypoints, auto-import settings, existing design tokens, and installed dependencies.
3. Select the smallest component set that satisfies the task.
4. Copy exact source from the skill into a local namespace such as `components/maya/`, `composables/maya/`, and `assets/css/maya.css`, unless the project already has a better convention.
5. Copy every local runtime dependency listed in imports. For example, if `Btn.vue` imports `useMayaSound`, include the composable or adapt the sound call deliberately.
6. Wire the CSS once at the app root. Do not duplicate `maya.css` per component.
7. Adapt imports, aliases, and naming to the target project after copying. Keep the behavior and visual tokens recognizable.
8. Run the project’s formatter, typecheck, and relevant tests when available.

## Folder Placement Defaults

Use these defaults when the target project does not already have a convention:

| Source type | Default target |
|---|---|
| Vue components | `components/maya/<Component>.vue` |
| Composables | `composables/maya/<composable>.ts` |
| Global CSS | `assets/css/maya.css` or `app/assets/css/maya.css` in Nuxt 4 projects |
| Plugin/module reference | Use `references/source/plugin.ts` only as a reference unless building a Nuxt module |

For Nuxt apps, add the copied CSS to `nuxt.config.ts` via `css: ['~/assets/css/maya.css']` when it is not already globally loaded.

## Maya Quality Rules

1. Components own internal padding; parent layouts own gaps. Do not add outer margins to reusable components.
2. Anything clickable needs a visible active state, usually `transform: scale(0.96)`.
3. Keep interactive targets at least 40px by 40px, using transparent hit-area expansion when the visual control is smaller.
4. Use Maya variables from `maya.css` for colors, radii, shadows, and motion. Avoid ad hoc generic colors like `green`, `red`, or `gray`.
5. Use layered shadows or Maya shadow variables. Avoid one flat shadow on elevated surfaces.
6. Use `transform` and `opacity` for animation whenever possible. Measure before animating dynamic height.
7. Render global overlays and queues once at the app root: toasts, dialogs, modals, popovers, and command palettes should not be duplicated inside local component trees.
8. Sound must be optional and never the only feedback. If copied sound dependencies are not desired, remove sound calls cleanly rather than leaving broken imports.
9. Respect reduced motion and keyboard accessibility for anything interactive.
10. Keep customizations token-level first. Change CSS variables and variants before rewriting component internals.

## Customization Contract

When the user asks for changes, customize in this order:

1. CSS variables in `maya.css`.
2. Component props or variants.
3. Local class additions that preserve existing state selectors.
4. Structural template changes only when the requested behavior needs them.

Document any intentional divergence from the bundled source in the final response, especially removed dependencies, renamed props, or changed animation behavior.

## Maintenance

The exact source mirror is generated from `src/runtime`:

```bash
node skills/maya-design/scripts/sync-source-references.mjs
```

Run that script after component, composable, `maya.css`, or `plugin.ts` changes so `references/source/` and `references/source-map.md` stay current.
