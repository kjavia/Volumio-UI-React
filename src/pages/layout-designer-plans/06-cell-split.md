# Feature 06 — Cell Split

## Purpose
Split any leaf cell (one with no existing subdivisions) into 2 sub-cells either horizontally (into rows) or vertically (into columns). Splitting is recursive — a sub-cell can be split further.

---

## Behaviour

- A split replaces `cell.subdivisions` (which is `null` on a leaf cell) with a subdivision structure containing 2 new empty child cells
- The original cell's `itemKey` is cleared (discarded) if it had one — splitting means the cell becomes a parent container
- Splitting does not affect any other cell in the grid — only the target cell

---

## Split into Rows

**Before:**
```
┌─────────────┐
│    Cell A   │   (1 cell, full width)
└─────────────┘
```

**After:**
```
┌─────────────┐
│  Sub-Cell 1 │   (row 1)
├─────────────┤
│  Sub-Cell 2 │   (row 2)
└─────────────┘
```

**Subdivision data:**
```js
subdivisions: {
  rows: 2,
  cols: 1,
  rowFractions: [1, 1],
  colFractions: [1],
  cells: [
    [{ id: uuid(), itemKey: null, subdivisions: null, colSpan: 1, rowSpan: 1, alignItems: 'center', justifyContent: 'center' }],
    [{ id: uuid(), itemKey: null, subdivisions: null, colSpan: 1, rowSpan: 1, alignItems: 'center', justifyContent: 'center' }],
  ]
}
```

---

## Split into Columns

**Before:**
```
┌─────────────┐
│    Cell A   │
└─────────────┘
```

**After:**
```
┌──────┬──────┐
│ Sub1 │ Sub2 │
└──────┴──────┘
```

**Subdivision data:**
```js
subdivisions: {
  rows: 1,
  cols: 2,
  rowFractions: [1],
  colFractions: [1, 1],
  cells: [
    [
      { id: uuid(), itemKey: null, subdivisions: null, colSpan: 1, rowSpan: 1, alignItems: 'center', justifyContent: 'center' },
      { id: uuid(), itemKey: null, subdivisions: null, colSpan: 1, rowSpan: 1, alignItems: 'center', justifyContent: 'center' },
    ]
  ]
}
```

---

## Handler

```js
function makeSubCell() {
  return { id: crypto.randomUUID(), itemKey: null, subdivisions: null, colSpan: 1, rowSpan: 1, alignItems: 'center', justifyContent: 'center' };
}

function handleSplitCellIntoRows(cellId) {
  const newCells = updateCellById(activeLayout.cells, cellId, {
    itemKey: null,   // discard any existing item
    subdivisions: {
      rows: 2, cols: 1,
      rowFractions: [1, 1],
      colFractions: [1],
      cells: [[makeSubCell()], [makeSubCell()]],
    }
  });
  const newLayout = { ...activeLayout, cells: newCells };
  const updated = layouts.map(l => l.id === activeLayoutId ? newLayout : l);
  setLayouts(updated);
  persistLayouts(updated);
  setSelectedCells([]);   // clear selection after split
}

function handleSplitCellIntoColumns(cellId) {
  const newCells = updateCellById(activeLayout.cells, cellId, {
    itemKey: null,
    subdivisions: {
      rows: 1, cols: 2,
      rowFractions: [1],
      colFractions: [1, 1],
      cells: [[makeSubCell(), makeSubCell()]],
    }
  });
  const newLayout = { ...activeLayout, cells: newCells };
  const updated = layouts.map(l => l.id === activeLayoutId ? newLayout : l);
  setLayouts(updated);
  persistLayouts(updated);
  setSelectedCells([]);
}
```

`updateCellById` is defined in Feature 05.

---

## Nesting Depth

There is no enforced maximum depth. A sub-cell can be split again, creating deeper nested subdivisions. The grid renderer (Feature 02) handles this recursively.

---

## Enabled Condition

Split is only enabled when:
- Exactly 1 cell is selected (`selectedCells.length === 1`)
- The cell has no subdivisions (`!selectedCellObj.subdivisions`)

```js
const canSplit = !!selectedCellObj && !selectedCellObj.subdivisions;
```

---

## Removing a Split (Un-split)

There is no explicit "un-split" button. To restore a cell to a leaf state, the user must remove the sub-cells one by one until the last one, which removes the subdivision entirely (see Feature 05 — Remove Cell).

Alternatively, if the user removes all sub-cells from a subdivided cell, the subdivision should be cleaned up automatically:

```js
// When handleRemoveCell results in all subdivision slots being null,
// replace the parent's subdivisions with null to restore it as a leaf cell.
```

---

## Acceptance Criteria

- [ ] "Split into Rows" creates 2 equal sub-cells stacked vertically inside the selected cell
- [ ] "Split into Columns" creates 2 equal sub-cells side by side inside the selected cell
- [ ] Split is disabled when the cell already has subdivisions
- [ ] Any existing `itemKey` on the cell is cleared after split
- [ ] Sub-cells are selectable and can themselves be split
- [ ] Split does not affect any other cell in the grid
- [ ] Selection is cleared after a split
- [ ] `updateCellById` correctly updates at any nesting depth
