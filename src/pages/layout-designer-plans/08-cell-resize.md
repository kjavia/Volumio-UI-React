# Feature 08 — Cell Resize

## Purpose
Allow users to resize cells horizontally or vertically by dragging the borders between them. Resize is implemented by adjusting the `fr` fraction values in `colFractions` and `rowFractions` arrays.

---

## How It Works

CSS Grid fractional units (`fr`) are stored per-layout (and per-subdivision). Dragging a border between two columns redistributes the total `fr` between those two adjacent tracks, keeping the total constant.

**Example:** 3 columns with fractions `[1, 1, 1]` — each takes 1/3 of space. Dragging the border between column 1 and 2 rightward might yield `[1.4, 0.6, 1]`.

---

## Resize Handle Placement

Each cell renders resize handles on its right (for column resize) and bottom (for row resize) edges. Handles are only rendered when there IS a next sibling in that direction (i.e., not the last column / last row).

```jsx
// Inside each leaf cell render:
{colIdx < colFractions.length - 1 && (
  <div
    className="layout-resize-handle layout-resize-handle--col"
    onMouseDown={(e) => handleResizeMouseDown(e, 'col', colIdx)}
  />
)}
{rowIdx < rowFractions.length - 1 && (
  <div
    className="layout-resize-handle layout-resize-handle--row"
    onMouseDown={(e) => handleResizeMouseDown(e, 'row', rowIdx)}
  />
)}
```

For nested grids (subdivisions), pass `subColFractions`/`subRowFractions` down and use a subdivision-specific resize handler.

---

## Resize Handle Styles

```scss
.layout-resize-handle {
  position: absolute;
  z-index: 10;
  
  &--col {
    right: -3px;
    top: 0;
    width: 6px;
    height: 100%;
    cursor: col-resize;
  }

  &--row {
    bottom: -3px;
    left: 0;
    width: 100%;
    height: 6px;
    cursor: row-resize;
  }

  &:hover, &:active {
    background: var(--bs-primary);
    opacity: 0.5;
  }
}
```

---

## Drag Logic

Use a `useRef` for drag state (avoids stale closure issues from useState):

```js
const dragRef = useRef(null);
// shape: { type: 'col'|'row', index: number, startX: number, startY: number,
//          startFrA: number, startFrB: number, totalSize: number,
//          cellId: string|null }  // cellId for subdivision-level drags
```

### handleResizeMouseDown

```js
function handleResizeMouseDown(e, type, index, cellId = null) {
  e.preventDefault();
  e.stopPropagation();

  const fractions = cellId
    ? getSubFractions(activeLayout.cells, cellId, type)
    : (type === 'col' ? colFractions : rowFractions);

  const containerRect = e.currentTarget.closest('.layout-grid').getBoundingClientRect();
  const totalSize = type === 'col' ? containerRect.width : containerRect.height;

  dragRef.current = {
    type,
    index,
    startX: e.clientX,
    startY: e.clientY,
    startFrA: fractions[index],
    startFrB: fractions[index + 1],
    totalFr: fractions[index] + fractions[index + 1],
    totalSize,
    cellId,
  };

  window.addEventListener('mousemove', handleResizeMouseMove);
  window.addEventListener('mouseup', handleResizeMouseUp);
}
```

### handleResizeMouseMove

```js
function handleResizeMouseMove(e) {
  if (!dragRef.current || !activeLayout) return;
  const { type, index, startX, startY, startFrA, startFrB, totalFr, totalSize, cellId } = dragRef.current;

  const delta = type === 'col' ? e.clientX - startX : e.clientY - startY;
  const deltaFr = (delta / totalSize) * totalFr;

  const minFr = 0.1;  // minimum fraction to prevent collapse
  const newFrA = Math.max(minFr, Math.min(totalFr - minFr, startFrA + deltaFr));
  const newFrB = totalFr - newFrA;

  setLayouts(prev => prev.map(l => {
    if (l.id !== activeLayoutId) return l;
    if (cellId) {
      // Update subdivision fractions
      return {
        ...l,
        cells: updateSubFractions(l.cells, cellId, type, index, newFrA, newFrB),
      };
    }
    // Update top-level fractions
    if (type === 'col') {
      const cf = [...(l.colFractions || Array(l.cols).fill(1))];
      cf[index] = newFrA; cf[index + 1] = newFrB;
      return { ...l, colFractions: cf };
    } else {
      const rf = [...(l.rowFractions || Array(l.rows).fill(1))];
      rf[index] = newFrA; rf[index + 1] = newFrB;
      return { ...l, rowFractions: rf };
    }
  }));
}
```

### handleResizeMouseUp

```js
function handleResizeMouseUp() {
  window.removeEventListener('mousemove', handleResizeMouseMove);
  window.removeEventListener('mouseup', handleResizeMouseUp);
  if (dragRef.current && activeLayout) {
    // Persist final state
    setLayouts(prev => {
      persistLayouts(prev);
      return prev;
    });
  }
  dragRef.current = null;
}
```

**Note:** Because `handleResizeMouseMove` calls `setLayouts` many times during drag, persistence is deferred to `mouseup` only. This avoids flooding the socket with hundreds of events.

---

## Subdivision Resize

For cells with subdivisions, the resize handles inside the nested grid adjust `cell.subdivisions.rowFractions` / `cell.subdivisions.colFractions`. The `cellId` in `dragRef` identifies which cell's subdivision fractions to update.

Helper to update subdivision fractions:
```js
function updateSubFractions(cells, parentCellId, type, index, newFrA, newFrB) {
  return cells.map(row => (row || []).map(cell => {
    if (!cell) return cell;
    if (cell.id === parentCellId && cell.subdivisions) {
      const key = type === 'col' ? 'colFractions' : 'rowFractions';
      const fr = [...(cell.subdivisions[key] || [])];
      fr[index] = newFrA; fr[index + 1] = newFrB;
      return { ...cell, subdivisions: { ...cell.subdivisions, [key]: fr } };
    }
    if (cell.subdivisions) {
      return { ...cell, subdivisions: { ...cell.subdivisions, cells: updateSubFractions(cell.subdivisions.cells, parentCellId, type, index, newFrA, newFrB) } };
    }
    return cell;
  }));
}
```

---

## Constraints

- Minimum fraction: `0.1fr` — prevents a cell from collapsing to zero
- Resize only adjusts two adjacent tracks (the one before and after the handle), keeping total constant
- Resize does not affect other tracks in the same axis
- Cursor changes to `col-resize` / `row-resize` globally during drag (set on `document.body`)

---

## Acceptance Criteria

- [ ] Resize handles appear on right/bottom edges of cells (not on the last col/row)
- [ ] Dragging a column handle redistributes fr between adjacent columns
- [ ] Dragging a row handle redistributes fr between adjacent rows
- [ ] Minimum fraction (0.1fr) prevents cells from collapsing
- [ ] Resize works inside subdivisions (sub-grid fr values)
- [ ] Layout is persisted only on mouseup (not during drag)
- [ ] Cursor changes to col-resize / row-resize during drag
- [ ] Drag does not accidentally trigger cell selection
