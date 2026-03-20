# Skeuomorphic Theme - Color Palette

## Overview
The Skeuomorphic theme uses a carefully curated color palette centered around **Orange (#ff4500)** as the primary accent color, complemented by warm neutrals and success indicators.

---

## Color Groups

### 🎨 Primary (Orange)
The main brand and accent color throughout the interface.

| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-primary` | `#ff4500` | Main accent, CTAs, active states |
| `--color-primary-light` | `#ff7043` | Hover states, highlights |
| `--color-primary-dark` | `#d84315` | Pressed states, shadows |
| `--color-primary-deep` | `#bf360c` | Deep accents, borders |

### 🌫️ Neutrals (Grays)
Foundation colors for backgrounds, text, and structural elements.

| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-black` | `#000000` | Pure black |
| `--color-gray-950` to `--color-gray-010` | `#050505` → `#f5f5f5` | Full grayscale spectrum |
| `--color-white` | `#ffffff` | Pure white |

### 🪵 Warm Neutrals (Browns/Taupes)
Earthy tones that add warmth to the interface.

| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-taupe-dark` | `#55433c` | Dark warm panels, accents |
| `--color-taupe-medium` | `#8a7166` | Medium warm borders, dividers |
| `--color-taupe-light` | `#bda69e` | Light warm backgrounds |

### ✅ Success/Green
Positive states, confirmations, and success indicators.

| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-success` | `#00a300` | Success messages, indicators |
| `--color-success-dark` | `#006d00` | Dark success states |
| `--color-success-light` | `#33b833` | Light success highlights |

### ⚠️ Warning/Alert (Red)
Error states, warnings, and critical indicators.

| Variable | Hex | Usage |
|----------|-----|-------|
| `--color-alert` | `#ff3333` | Alerts, errors, warnings |
| `--color-alert-dark` | `#b71c1c` | Dark error states |
| `--color-alert-muted` | `#552222` | Muted warnings, off states |

---

## Semantic Variables

### Global Surfaces
- `--bg-color` - Main background
- `--device-surface` - Device chrome/bezel
- `--panel-bg-dark` - Dark panels
- `--panel-bg-warm` - Warm toned panels

### Text Colors
- `--text-primary` - Primary text
- `--text-secondary` - Secondary text
- `--text-muted` - Muted/disabled text
- `--text-light` - Light text on dark backgrounds
- `--text-accent` - Accent colored text (orange)

### Button Colors
- `--btn-bg-primary` - Primary button background
- `--btn-bg-success` - Success button background
- `--btn-bg-dark` / `--btn-bg-light` - Neutral buttons

### UI Components
- `--border-warm` - Warm toned borders
- `--indicator-success` / `--indicator-warning` / `--indicator-error`

---

## Gradients

### Primary Gradient
```css
--grad-primary: linear-gradient(90deg, #ff7043, #d84315);
```

### Metallic Gradient
```css
--grad-metallic: linear-gradient(180deg, #e0e0e0, #bdbdbd);
```

### Warm Gradient
```css
--grad-warm: linear-gradient(135deg, #bda69e, #55433c);
```

---

## Shadow & Highlight System

### Shadows (Black with opacity)
- `--shadow-02` through `--shadow-90` (0.02 to 0.9 opacity)
- Used for depth, elevation, and inset effects

### Highlights (White with opacity)
- `--highlight-03` through `--highlight-60` (0.03 to 0.6 opacity)
- Used for metallic shine, embossed effects

### Glow Effects
- `--glow-primary` - Orange glow (rgba(255, 69, 0, 0.4))
- `--glow-success` - Green glow (rgba(0, 163, 0, 0.4))

---

## Usage Examples

```scss
// Primary button
.btn-primary {
  background: var(--btn-bg-primary);
  color: var(--text-light);
  box-shadow: 0 2px 4px var(--shadow-30);
  
  &:hover {
    background: var(--color-primary-light);
  }
}

// Success indicator
.status-success {
  color: var(--color-success);
  background: var(--color-success-light);
}

// Warm panel
.panel-warm {
  background: var(--panel-bg-warm);
  border: 1px solid var(--border-warm);
}
```

---

## Legacy Aliases

For backward compatibility, old variable names are aliased to the new system:
- `--color-orange-vivid` → `--color-primary`
- `--text-orange` → `--text-accent`
- `--btn-bg-orange` → `--btn-bg-primary`

These will be deprecated in future versions.
