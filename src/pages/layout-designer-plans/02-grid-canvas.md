# Feature 02 — Grid Canvas Dialog

## Purpose
Display the active layout's cell grid inside a floating full-screen dialog with a toolbar. The canvas visually represents the layout at the correct aspect ratio.

---

## UI Structure

```
<Dialog> (full-screen overlay, scrollable)
├── Dialog Header: layout name + close button
├── Toolbar (Feature 04) — sticky at top
└── Canvas Area
    └── .layout-canvas  (fixed aspect ratio box, centered)
        └── .layout-grid (CSS Grid, renders all top-level cells)
            └── <Cell> per cell (recursive for subdivisions)
```

---

## Dialog Behaviour

- Opens when user clicks "Edit Layout" or immediately after creating a new layout
- Full-screen (Bootstrap `modal-fullscreen` or equivalent custom overlay)
- ESC key and close button both close the dialog — no unsaved-changes warning (all changes are already persisted)
- Dialog does NOT re-mount grid on open; it reads from `activeLayout` state directly

---

## Canvas Sizing

The canvas must reflect the actual width:height ratio of the layout, shrunk to fit the viewport.

```scss
.layout-canvas {
  width: 100%;
  max-width: min(90vw, calc(90vh * var(--layout-ratio)));
  aspect-ratio: var(--layout-ratio);  // set via inline style: width/height
  margin: 0 auto;
  position: relative;
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
}
```

Pass `style={{ '--layout-ratio': activeLayout.width / activeLayout.height }}` to `.layout-canvas`.

---

## CSS Grid Setup (Top Level)

```jsx
const colTemplate = colFractions.map(f => `${f}fr`).join(' ');
const rowTemplate = rowFractions.map(f => `${f}fr`).join(' ');

<div
  className="layout-grid"
  style={{
    display: 'grid',
    gridTemplateColumns: colTemplate,
    gridTemplateRows: rowTemplate,
    width: '100%',
    height: '100%',
  }}
  onClick={() => setSelectedCells([])}   // deselect on background click
>
  {renderCells(activeLayout.cells, colFractions, rowFractions)}
</div>
```

---

## Cell Rendering

### Top-level cells

Iterate `cells` as a flat list of `[row][col]` positions. For each non-null cell:

```jsx
function renderCells(cells, colFractions, rowFractions) {
  return cells.flatMap((rowArr, rowIdx) =>
    (rowArr || []).map((cell, colIdx) => {
      if (!cell) return null;   // null = slot occupied by a spanning cell — skip
      return (
        <Cell
          key={cell.id}
          cell={cell}
          rowIdx={rowIdx}
          colIdx={colIdx}
          colFractions={colFractions}
          rowFractions={rowFractions}
        />
      );
    })
  );
}
```

### Cell component

```jsx
function Cell({ cell, rowIdx, colIdx, colFractions, rowFractions }) {
  const colSpan = cell.colSpan || 1;
  const rowSpan = cell.rowSpan || 1;

  const style = {
    gridColumn: `${colIdx + 1} / span ${colSpan}`,
    gridRow: `${rowIdx + 1} / span ${rowSpan}`,
    display: 'flex',
    alignItems: cell.alignItems || 'center',
    justifyContent: cell.justifyContent || 'center',
    position: 'relative',
  };

  if (cell.subdivisions) {
    // Render a nested grid for subdivisions
    const { rows, cols, rowFractions: rF, colFractions: cF, cells: subCells } = cell.subdivisions;
    return (
      <div style={style} className="layout-cell layout-cell--parent">
        <div
          className="layout-grid layout-grid--nested"
          style={{
            display: 'grid',
            gridTemplateColumns: (cF || Array(cols).fill(1)).map(f => `${f}fr`).join(' '),
            gridTemplateRows: (rF || Array(rows).fill(1)).map(f => `${f}fr`).join(' '),
            width: '100%',
            height: '100%',
          }}
        >
          {renderCells(subCells, cF || Array(cols).fill(1), rF || Array(rows).fill(1))}
        </div>
      </div>
    );
  }

  return (
    <div
      style={style}
      className={`layout-cell ${isSelected ? 'layout-cell--selected' : ''}`}
      onClick={(e) => { e.stopPropagation(); handleCellClick(cell.id, e); }}
      onContextMenu={(e) => { e.preventDefault(); handleContextMenu(cell.id, e); }}
    >
      {cell.itemKey ? <span className="layout-cell__label">{LAYOUT_ITEMS[cell.itemKey]}</span> : null}
      {/* Resize handles — see Feature 08 */}
    </div>
  );
}
```

---

## Computed Fractions

```js
const colFractions = useMemo(
  () => activeLayout?.colFractions || Array(activeLayout?.cols || 1).fill(1),
  [activeLayout]
);
const rowFractions = useMemo(
  () => activeLayout?.rowFractions || Array(activeLayout?.rows || 1).fill(1),
  [activeLayout]
);
```

---

## CSS / SCSS

```scss
.layout-cell {
  border: 1px dashed var(--bs-border-color);
  cursor: pointer;
  box-sizing: border-box;
  overflow: hidden;
  min-width: 0;
  min-height: 0;
  transition: background 0.1s;

  &:hover {
    background: rgba(var(--bs-primary-rgb), 0.05);
  }

  &--selected {
    border: 2px solid var(--bs-primary);
    background: rgba(var(--bs-primary-rgb), 0.12);
  }

  &__label {
    font-size: 0.7rem;
    opacity: 0.6;
    pointer-events: none;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    padding: 0 4px;
  }
}

.layout-cell--parent {
  border: 1px dashed var(--bs-secondary);
  cursor: default;   // parent cells are not selectable — only their children are
  &:hover { background: none; }
}
```

---

## Acceptance Criteria

- [ ] Dialog opens when "Edit Layout" or on layout creation
- [ ] Dialog is full-screen, closeable by ESC or close button
- [ ] Canvas respects aspect ratio of width:height
- [ ] CSS grid renders correct number of rows and columns
- [ ] Each non-null cell is rendered with gridColumn/gridRow placement
- [ ] Null slots (from spanning) are skipped without breaking layout
- [ ] Cells with subdivisions render a nested grid (not selectable at the parent level)
- [ ] Background click deselects all cells
- [ ] No console errors from duplicate React keys
