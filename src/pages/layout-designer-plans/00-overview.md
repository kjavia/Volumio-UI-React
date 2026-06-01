# Layout Designer — Build Plan Overview

A page in Stylish Player that lets users visually design screen-resolution-specific layouts for the player screen. The designer uses a CSS Grid canvas inside a floating dialog. All changes are saved instantly to plugin config.

## Feature Index

| # | Feature | File |
|---|---------|------|
| 01 | Layout CRUD & Selector | [01-layout-crud.md](./01-layout-crud.md) |
| 02 | Grid Canvas Dialog | [02-grid-canvas.md](./02-grid-canvas.md) |
| 03 | Cell Selection | [03-cell-selection.md](./03-cell-selection.md) |
| 04 | Toolbar | [04-toolbar.md](./04-toolbar.md) |
| 05 | Context Menu & Item Assignment | [05-context-menu.md](./05-context-menu.md) |
| 06 | Cell Split | [06-cell-split.md](./06-cell-split.md) |
| 07 | Cell Merge | [07-cell-merge.md](./07-cell-merge.md) |
| 08 | Cell Resize | [08-cell-resize.md](./08-cell-resize.md) |
| 09 | Persist & Load Config | [09-persist-config.md](./09-persist-config.md) |
| 10 | Custom Player Integration | [10-custom-player.md](./10-custom-player.md) |

## Recommended Build Order

Build each feature in the numbered order. Features 01–02 are the foundation. Features 03–05 are the core interaction layer. Features 06–08 are the advanced grid manipulation. Features 09–10 complete the integration.

## Data Model

```js
// A single layout
{
  id: string,           // UUID
  name: string,         // user-defined, unique per resolution
  width: number,        // px
  height: number,       // px
  isDefault: boolean,   // one default per resolution
  rows: number,         // current top-level row count
  cols: number,         // current top-level col count
  rowFractions: number[], // fr values per row (length = rows)
  colFractions: number[], // fr values per col (length = cols)
  cells: Cell[][]       // 2D array [row][col], null = spanned slot
}

// A single cell (recursive)
{
  id: string,
  itemKey: string | null,       // key from LAYOUT_ITEMS
  subdivisions: null | {
    rows: number,
    cols: number,
    rowFractions: number[],
    colFractions: number[],
    cells: Cell[][]             // nested 2D array
  },
  colSpan: number,   // default 1
  rowSpan: number,   // default 1
  alignItems: string,   // flex align-items
  justifyContent: string // flex justify-content
}
```

## Layout Items (12 total)

| Key | Label |
|-----|-------|
| `trackName` | Track Title |
| `albumName` | Album Name |
| `artistName` | Artist Name |
| `samplingRate` | Bitrate / Sample Rate |
| `serviceLogo` | Service Logo |
| `playerControls` | Player Buttons |
| `volumeSlider` | Volume Slider (horizontal) |
| `volumeButton` | Volume Button (vertical slider) |
| `progressBar` | Track Progress Bar |
| `buttonRow` | Control Buttons |
| `viz` | Visualization |
| `player` | Player (Vinyl/CD) |

## File Locations

- Page component: `src/pages/LayoutDesigner.jsx`
- Page styles: `src/pages/layout-designer.scss`
- Custom player: `src/components/CustomPlayer.jsx`
- Route: added in `App.jsx` (existing pattern)
