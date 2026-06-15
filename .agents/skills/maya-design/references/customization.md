# Maya UI Customization Guide

Use this reference when the user asks to change visual style, behavior, variants, shadows, theme, animations, or component names.

## Customization Order

Start with the least invasive change that satisfies the request:

1. Change CSS variables in `maya.css`.
2. Add or adjust component variants and props.
3. Add scoped classes while preserving existing state selectors.
4. Change template structure only when behavior requires it.
5. Fork component internals only when the user needs a genuinely new component.

This order keeps source updates easier to re-apply later.

## Theme

Maya uses CSS variables as the theme contract. Customize at the token layer when possible:

```css
:root {
  --maya-radius-md: 8px;
  --maya-duration: 160ms;
}

[data-theme="dark"] {
  --maya-bg-root: #090909;
  --maya-bg-surface: #131313;
  --maya-text-primary: #f1f1f1;
}
```

Keep both themes coherent. If you change a semantic color in dark mode, check the matching light-mode value too.

## Shadows and Surfaces

Maya surfaces should have depth from layered shadows, inset edges, or gradient overlays. Avoid replacing them with a single generic shadow.

Preferred:

```css
box-shadow:
  inset 0 1px 0 rgba(255, 255, 255, 0.08),
  0 8px 30px rgba(0, 0, 0, 0.18),
  0 0 0 1px var(--maya-border);
```

Avoid:

```css
box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
```

For nested surfaces, use the next existing surface variable. Do not stack more than three distinct surface levels in one area.

## Motion

Preserve Maya's tactile motion language:

```css
transition:
  transform var(--maya-duration) var(--maya-ease),
  opacity var(--maya-duration) var(--maya-ease),
  background-color var(--maya-duration) var(--maya-ease);
```

Use active compression for buttons and clickable controls:

```css
.control:active {
  transform: scale(0.96);
}
```

Do not animate `width`, `height`, `top`, or `left` directly for dynamic content. Use transform/opacity or measure dimensions before animating.

## Variants

When adding variants, keep the class naming pattern already used by the source component:

```vue
<button class="maya-btn" :class="[`maya-btn--${variant}`, `maya-btn--${size}`]">
```

```css
.maya-btn--soft {
  background: var(--maya-bg-raised);
  color: var(--maya-text-primary);
  border: 1px solid var(--maya-border);
}
```

Prefer variants over unrelated one-off class names when the behavior should be reusable.

## Removing Optional Behavior

Some components include tactile sound, syntax highlighting, 3D/canvas behavior, or icon dependencies. If the target project should not include that dependency:

1. Remove the import.
2. Remove the callsite.
3. Preserve the visual state that communicated the same feedback.
4. Mention the removed behavior in the final response.

Example: if removing `useMayaSound` from `Btn.vue`, keep hover, focus, and active states intact.

## Accessibility

Customization must preserve:

1. Keyboard navigation and focus-visible states.
2. ARIA roles and labels on custom controls.
3. Escape/outside-click behavior for dismissible overlays.
4. Scroll lock for blocking dialogs.
5. Reduced-motion behavior when animations are large or repeated.

Do not use sound, color, or animation as the only signal for a state change.

## Final Response Notes

When delivering customized source, mention:

1. Which Maya source files were copied.
2. Which dependencies were included or removed.
3. Where global CSS was wired.
4. Any intentional divergence from the bundled source.
