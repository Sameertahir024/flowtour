# FlowTour

A lightweight, animated product-tour and element-highlight library — the same job as [driver.js](https://driverjs.com), tuned for smoother motion and easy theming.

- **~4 KB** core, zero dependencies
- Spotlight and popover **glide** or **morph** smoothly between steps
- **Aceternity-inspired `morph` animation** with fluid spring transitions and ambient glow
- **Theme presets built-in**: `auto`, `dark`, `light`, `glass`, `midnight`
- **Custom `accentColor`** to seamlessly match your product brand buttons and progress dots
- Clickable progress navigation dots with step jumping
- Real-time scroll repositioning and responsive viewport awareness
- Keyboard nav (`ArrowRight`, `ArrowLeft`, `Escape`), focus trap, `prefers-reduced-motion` support out of the box
- Ships ESM, CJS, and a plain `<script>` global build — works with any stack

## Install

```bash
npm install flowtour
```

```js
import { createTour } from 'flowtour';
import 'flowtour/flowtour.css';
```

Or drop it in directly, no build step:

```html
<link rel="stylesheet" href="https://unpkg.com/flowtour/dist/flowtour.css" />
<script src="https://unpkg.com/flowtour/dist/flowtour.global.js"></script>
<script>
  const tour = FlowTour.createTour({ steps: [ /* ... */ ] });
</script>
```

## Usage

```js
import { createTour } from 'flowtour';

const tour = createTour({
  theme: 'dark',                  // 'auto' | 'dark' | 'light' | 'glass' | 'midnight'
  accentColor: '#ef4444',         // Custom brand highlight / button color
  animationStyle: 'morph',        // 'glide' | 'morph'
  showRing: true,                 // Glowing accent ring around active target
  ringColor: '#ef4444',
  ringWidth: 2,
  steps: [
    {
      element: '#dashboard-nav',
      popover: { title: 'Your workspace nav', description: 'Everything lives behind these tabs.' },
    },
    {
      element: document.querySelector('#invite-button'), // a live element works too
      popover: { title: 'Bring your team', description: 'Invite people whenever you\'re ready.' },
    },
  ],
  onDestroyed: () => console.log('tour finished or closed'),
});

document.getElementById('start-tour').addEventListener('click', () => tour.drive());
```

## API

### `createTour(config): TourInstance`

| Config field | Type | Default | Description |
|---|---|---|---|
| `steps` | `TourStep[]` | required | The steps to walk through. |
| `animationStyle` | `'morph' \| 'glide' \| 'simple'` | `'morph'` | Popover & spotlight transition style. |
| `animationSpeed` | `number \| string` | — | Custom duration (e.g. `600` or `'0.6s'`). |
| `theme` | `'auto' \| 'dark' \| 'light' \| 'glass' \| 'midnight'` | `'auto'` | Built-in visual theme preset. |
| `accentColor` | `string` | — | Custom accent color override (e.g. `#10b981`). |
| `width` / `maxWidth` | `number \| string` | — | Custom card width (e.g. `340`, `'360px'`). |
| `showRing` | `boolean` | `true` | Displays an accent ring around the highlighted target. |
| `ringColor` | `string` | — | Custom color for the target spotlight ring. |
| `ringWidth` | `number` | `1.5` | Width (px) of the ring outline. |
| `showBackdrop` | `boolean` | `true` | Dim the page behind the spotlight. |
| `closeOnBackdropClick` | `boolean` | `true` | Click outside the spotlight to end the tour. |
| `allowClose` | `boolean` | `true` | Let `Escape` close the tour. |
| `showProgress` | `boolean` | `true` | Show interactive progress dots in the footer. |
| `scrollIntoView` | `boolean` | `true` | Auto-scroll a step's target into view if off-screen. |
| `nextBtnText` / `prevBtnText` / `doneBtnText` | `string` | `'Next'` / `'Back'` / `'Done'` | Button labels. |
| `onNext(from, to)` / `onPrev(from, to)` | `function` | — | Fired on step change. |
| `onDestroyStarted()` / `onDestroyed()` | `function` | — | Fired when the tour closes (before / after exit). |

Each `TourStep` takes:

| Field | Type | Description |
|---|---|---|
| `element` | `string \| HTMLElement` | Selector or live element to spotlight. |
| `popover.title` / `popover.description` | `string` | Popover copy. |
| `popover.side` | `'top' \| 'bottom' \| 'left' \| 'right' \| 'auto'` | Preferred side; falls back automatically if space is constrained. |
| `width` / `maxWidth` | `number \| string` | Per-step width override. |
| `padding` | `number` | Space (px) between target and spotlight. Default `8`. |
| `radius` | `number` | Corner radius. Defaults to target element's border-radius. |
| `theme` | `TourTheme` | Per-step theme override. |
| `accentColor` | `string` | Per-step accent color override. |
| `showRing` / `ringColor` / `ringWidth` | — | Per-step ring customizations. |
| `onBeforeHighlight(step)` | `function` | Return `false` to skip this step. |
| `onHighlighted(step)` | `function` | Fires once the step has finished animating in. |

### `TourInstance` methods

`drive(startIndex?)` · `moveNext()` · `movePrevious()` · `moveTo(index)` · `destroy()` · `isActive()` · `currentIndex()`

## Animation Styles

FlowTour includes three finely tuned transition styles:

- **`morph` (Default / Aceternity-inspired)**: Fluid spring cubic-bezier tracking with ambient glow as the spotlight travels across nodes.
- **`glide`**: Classic smooth slide entrance with responsive damping.
- **`simple`**: Instant, zero-crawl spotlight focus for quick, lightweight transitions.

## Theming

Every visual is a CSS custom property:

```css
:root {
  --ft-accent: #6e56ff;
  --ft-pop-bg: #11131f;
  --ft-pop-fg: #f4f4f6;
  --ft-pop-radius: 14px;
  --ft-duration: 0.38s;
  --ft-easing: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

## Development

```bash
npm install
npm run dev      # tsup --watch
npm test         # vitest
npm run build    # emits dist/ (ESM, CJS, IIFE, .d.ts, CSS)
```

Open `examples/basic.html` (after building) to try it live in your browser.

## License

MIT
