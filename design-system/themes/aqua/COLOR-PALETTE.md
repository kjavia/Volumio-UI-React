# Aqua Theme Color Palette

Classic macOS Aqua design system with glossy gel buttons, frosted glass panels, and iconic traffic light colors.

## Overview

The Aqua theme recreates the signature look of classic macOS (OS X 10.0-10.4) with:
- **Primary accent**: Aqua Blue (#147aff) - the iconic macOS blue
- **Surface**: Brushed aluminum and silver tones
- **Traffic lights**: Green, Yellow, and Red semantic colors
- **Glass effects**: Frosted glass with vibrancy/transparency

---

## Color Groups

### Primary (Aqua Blue)
The signature macOS Aqua accent color used for buttons, links, and highlights.

```scss
--color-primary: #147aff          // Classic macOS Aqua blue
--color-primary-light: #6cabff
--color-primary-dark: #1060e8
--color-primary-deep: #0036ab
```

### Neutrals (Silver & Grays)
Ranging from deep blacks to bright silver, mimicking brushed aluminum surfaces.

```scss
--color-black: #000000
--color-gray-900: #2c2c2c
--color-gray-700: #555555
--color-gray-500: #888888
--color-gray-300: #c4c4c4
--color-gray-100: #ebebeb        // Classic macOS window background
--color-gray-050: #f2f2f2
--color-white: #ffffff
```

### Secondary (Silver)
Neutral silver tones for secondary UI elements.

```scss
--color-secondary: #a0a0a0
--color-secondary-light: #c0c0c0
--color-secondary-dark: #808080
```

### Success (Traffic Light Green)
```scss
--color-success: #28c840
--color-success-dark: #1ea832
--color-success-light: #5dd773
```

### Warning (Traffic Light Yellow)
```scss
--color-warning: #ffbd2e
--color-warning-dark: #e6a320
--color-warning-light: #ffd76f
```

### Danger (Traffic Light Red)
```scss
--color-danger: #ff5f57
--color-danger-dark: #d93832
--color-danger-light: #ff8f88
--color-danger-muted: #4a2020
```

### Info (Teal/Cyan)
Classic Aqua era accent color for informational elements.

```scss
--color-info: #00b4d8
--color-info-dark: #0077b6
--color-info-light: #48cae4
```

---

## Semantic Variables

### Text Colors
```scss
--text-primary: #1d1d1f          // Apple's near-black
--text-secondary: #6e6e6e
--text-accent: #147aff           // Aqua blue
--text-success: #1ea832
--text-warning: #e6a320
--text-danger: #ff5f57
--text-info: #0077b6
```

### Background Colors
```scss
--bg-color: #ebebeb             // Classic macOS window gray
--panel-bg-dark: #1c1c1e
--device-surface: #dcdcdc       // Brushed aluminum panel
```

### Button Backgrounds
```scss
--btn-bg-primary: #147aff
--btn-bg-secondary: #a0a0a0
--btn-bg-success: #28c840
--btn-bg-warning: #ffbd2e
--btn-bg-danger: #ff5f57
--btn-bg-info: #00b4d8
--btn-bg-light: #ffffff
--btn-bg-dark: #3a3a3c
```

### Alert/Notification Backgrounds
Semi-transparent colored backgrounds for alerts and notifications.

```scss
--alert-bg-success: rgba(40, 200, 64, 0.12)
--alert-bg-warning: rgba(255, 189, 46, 0.12)
--alert-bg-danger: rgba(255, 95, 87, 0.12)
--alert-bg-info: rgba(0, 180, 216, 0.12)
```

### Border Colors
```scss
--border-primary: #147aff
--border-secondary: #a0a0a0
--border-success: #28c840
--border-warning: #ffbd2e
--border-danger: #ff5f57
--border-info: #00b4d8
--border-light: rgba(255, 255, 255, 0.8)
--border-dark: rgba(0, 0, 0, 0.12)
```

### Status Indicators
```scss
--indicator-success: #28c840
--indicator-warning: #ffbd2e
--indicator-danger: #ff5f57
--indicator-info: #00b4d8
--led-on: #28c840               // Green LED active
--led-off: #1a5c24              // Green LED inactive
```

---

## Gradients

### Button Gradients (Aqua Gel Effect)
Classic macOS gel button effect with glossy highlights.

```scss
--btn-primary-top: #6db3f2
--btn-primary-btm: #1e69de

--btn-secondary-top: #c0c0c0
--btn-secondary-btm: #808080

--btn-success-top: #5dd773
--btn-success-btm: #1ea832

--btn-warning-top: #ffd76f
--btn-warning-btm: #e6a320

--btn-danger-top: #ff8f88
--btn-danger-btm: #d93832

--btn-info-top: #48cae4
--btn-info-btm: #0077b6
```

### Surface Gradients
```scss
--grad-primary: linear-gradient(180deg, #6cabff, #1060e8)
--grad-metallic: linear-gradient(180deg, #f5f5f5, #d8d8d8)
--grad-window: linear-gradient(180deg, #e8e8e8, #d4d4d4)
```

---

## Shadow & Highlights

### Shadow Overlays
```scss
--shadow-02 through --shadow-90    // rgba(0, 0, 0, 0.02) to rgba(0, 0, 0, 0.9)
```

### Highlight Overlays
For frosted glass and glossy effects.

```scss
--highlight-03 through --highlight-80    // rgba(255, 255, 255, 0.03) to (0.8)
```

### Glow Effects
For focus states and interactive elements.

```scss
--glow-primary: rgba(20, 122, 255, 0.4)
--glow-success: rgba(40, 200, 64, 0.4)
--glow-warning: rgba(255, 189, 46, 0.4)
--glow-danger: rgba(255, 95, 87, 0.4)
--glow-info: rgba(0, 180, 216, 0.4)
```

---

## Typography

### Font Families
```scss
--font-body: -apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif
--font-label: -apple-system, 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif
--font-display: -apple-system, 'SF Pro Display', 'Helvetica Neue', Arial, sans-serif
--font-mono: 'SF Mono', 'Menlo', 'Courier New', monospace
```

### Type Scale
```scss
--text-xs: 0.6875rem (11px)     // macOS menu/label size
--text-sm: 0.8125rem (13px)     // macOS default UI size
--text-base: 0.875rem (14px)
--text-md: 1rem (16px)
--text-lg: 1.125rem (18px)
--text-xl: 1.25rem (20px)
--text-2xl: 1.5rem (24px)
--text-3xl: 2rem (32px)
--text-4xl: 2.5rem (40px)
```

---

## Usage Examples

### Buttons
```jsx
<button className="btn btn-primary">Aqua Blue</button>
<button className="btn btn-secondary">Silver</button>
<button className="btn btn-success">Green</button>
<button className="btn btn-warning">Yellow</button>
<button className="btn btn-danger">Red</button>
<button className="btn btn-info">Teal</button>
```

### Text Colors
```jsx
<span className="text-primary">Dark text</span>
<span className="text-accent">Aqua blue text</span>
<span className="text-success">Success text</span>
<span className="text-warning">Warning text</span>
<span className="text-danger">Danger text</span>
```

### Custom CSS
```css
.my-element {
    background: var(--bg-color);
    color: var(--text-primary);
    border: 1px solid var(--border-light);
    box-shadow: 0 2px 8px var(--shadow-15);
}

.frosted-panel {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid var(--border-light);
}
```

---

## Backward Compatibility

Legacy variable names are aliased to new semantic names:

```scss
// Legacy Aqua
--color-aqua-vivid → --color-primary
--color-aqua-bright → --color-primary-light

// Legacy Traffic Lights
--color-green-vivid → --color-success
--color-yellow-vivid → --color-warning
--color-red-vivid → --color-danger

// Legacy Teal
--color-teal-vivid → --color-info

// Legacy Text
--text-dark → --text-primary
--text-aqua → --text-accent

// Legacy Buttons
--btn-bg-accent → --btn-bg-primary
--btn-accent-top → --btn-primary-top
```

---

## Design Philosophy

The Aqua theme embodies classic macOS design principles:

1. **Glossy Gel Buttons**: Signature gel effect with gradient highlights
2. **Frosted Glass**: Semi-transparent panels with blur effects
3. **Traffic Lights**: Green, Yellow, Red for semantic actions
4. **Silver & Aluminum**: Brushed metal surface aesthetic
5. **Vibrant Blue**: Iconic Aqua blue for primary actions
6. **Subtle Shadows**: Depth through layered drop shadows
7. **High Contrast**: Clear visual hierarchy with strong contrasts
