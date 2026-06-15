# Maya UI: Motion Design & Animation Principles

## 1. Motion Curves (Cubic Bezier)

| Name | Cubic Bezier | Use When |
|---|---|---|
| `ease-out` | `cubic-bezier(0.19, 1, 0.22, 1)` | UI-initiated entrances. Arrives fast, settles gently. |
| `ease-in` | `cubic-bezier(0.55, 0.05, 0.68, 0.19)` | Exits. Builds momentum, leaves quickly. |
| `ease-in-out` | `cubic-bezier(0.455, 0.03, 0.515, 0.955)` | Deliberate guided transitions between two states. |
| `spring-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | User-input reactions (press, toggle, icon swap). Y > 1 = overshoot. |

> **Never use `linear`** except for continuous progress/loading bars.

---

## 2. Duration Scale

| Use Case | Duration | Curve |
|---|---|---|
| Hover / press state | 100–150ms | `ease-out` |
| Small state change (icon, colour, label) | 150–250ms | `ease-out` or `spring-bounce` |
| Panel / dropdown open | 200–250ms | `ease-out` |
| Modal entrance | 250–300ms | `ease-out` |
| Modal exit / dismiss | 150ms | `ease-in` (faster than entrance) |
| Page transition | 250–400ms | `ease-in-out` |
| Theme reveal circle | 500ms | `ease-in-out` |
| Icon swap bounce | 400ms | `spring-bounce` (needs room for wobble) |

> **Consistency rule:** If standard buttons use 150ms, ALL buttons use 150ms.

---

## 3. Decision Matrix: Which Motion Curve?

```text
Is the motion triggered by user input (click, press, toggle, flick)?
  YES → spring-bounce (0.34, 1.56, 0.64, 1)
  NO → Is something entering the screen?
         YES → ease-out (0.19, 1, 0.22, 1)
         NO → Is something leaving?
                YES → ease-in (0.55, 0.05, 0.68, 0.19)
                NO → ease-in-out (0.455, 0.03, 0.515, 0.955)
```

---

## 4. Implementation: Theme Toggle (Cinematic Circular Reveal)

```js
// Nuxt example using @nuxtjs/color-mode
// For Vanilla JS, replace colorMode logic with: document.documentElement.classList.toggle('dark')

const colorMode = useColorMode()

async function toggleTheme(event) {
  const newTheme = colorMode.value === 'dark' ? 'light' : 'dark'

  // 1. Fallback for browsers without View Transition API
  if (!document.startViewTransition) {
    colorMode.preference = newTheme
    return
  }

  // 2. Capture click origin
  const x = event.clientX;
  const y = event.clientY;

  // 3. Calculate maximum radius (Pythagorean)
  const maxRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  // 4. Use View Transition API
  const transition = document.startViewTransition(() => {
    colorMode.preference = newTheme
  });

  await transition.ready;

  // 5. Animate the reveal circle
  document.documentElement.animate(
    { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${maxRadius}px at ${x}px ${y}px)`] },
    { duration: 500, easing: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)', pseudoElement: '::view-transition-new(root)' }
  );
}
```
Disable default crossfade in CSS:
```css
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}
::view-transition-old(root) { z-index: 1; }
::view-transition-new(root) { z-index: 9999; }
```

---

## 5. Implementation: Container Height Animation (Accordion)

```js
// Pattern: measure inner, animate outer wrapper
const inner = accordion.querySelector('.inner-content');
const wrapper = accordion.querySelector('.height-wrapper');

function expand() {
  const targetH = inner.scrollHeight;
  wrapper.animate(
    [{ height: '0px' }, { height: `${targetH}px` }],
    { duration: 250, easing: 'cubic-bezier(0.19, 1, 0.22, 1)', fill: 'forwards' }
  );
}
```
Never query `offsetHeight` and animate the same node — causes infinite layout loops.

---

## 6. Implementation: Icon Swap Mechanics (Copy → Checkmark)

1. Parent container: `scale(0.96)` on trigger — tactile depress.
2. Leaving icon: `scale(0.5) + opacity(0)`, ease-in, 150ms.
3. After leaving completes (or overlap at 100ms):
   Entering icon: `scale(0.5) → scale(1) + opacity(0→1)`, spring-bounce `(0.34, 1.56, 0.64, 1)`, 400ms.
4. Parent container: `scale(1)` restore, spring-bounce, 200ms.
