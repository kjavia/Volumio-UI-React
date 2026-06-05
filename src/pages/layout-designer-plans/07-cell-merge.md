# Feature 07 — Cell Merge

## Purpose
Merge 2 or more adjacent cells into a single cell. The merged cell uses CSS `colSpan` or `rowSpan` to span the space of all constituent cells. Works at any nesting depth.

---

## Rules

- Selected cells must all be in the same parent cells array (same level of nesting)
- Selected cells must form a contiguous run in either a single row OR a single column (not both, not diagonal)
- Cells with subdivisions CAN be merged — their subdivision content is discarded
- Cells with items CAN be merged — their item content is discarded (no confirmation)
- The resulting merged cell always has `itemKey: null` and `subdivisions: null`
- After merge, selection is cleared

---

## Merge into Column Span (same row)

**Before:** 3 cells in the same row, all selected
```
┌──────┬──────┬──────┐
│  A*  │  B*  │  C*  │    (* = selected)
└──────┴──────┴──────┘
```

**After:** Single cell spanning 3 columns
```
┌────────────────────┐
│     merged (A+B+C) │   colSpan: 3
└────────────────────┘
```

**cells array:**
```js
// Before (1 row, 3 cols):
[[cellA, cellB, cellC]]

// After (1 row, 1 merged cell):
[[mergedCell]]   // mergedCell.colSpan = 3
```

**Top-level cols update:** `layout.cols` decreases by `(selectedCount - 1)`

---

## Merge into Row Span (same column)

**Before:** 2 cells in the same column, all selected
```
┌──────────────────┐
│       A*         │    (* = selected)
├──────────────────┤
│       B*         │
└──────────────────┘
```

**After:** Single cell spanning 2 rows
```
┌──────────────────┐
│   merged (A+B)   │   rowSpan: 2
│                  │
└──────────────────┘
```

**cells array:**
```js
// Before (2 rows, 1 col each):
[[cellA], [cellB]]

// After:
[[mergedCell], [null]]   // null marks the spanned slot
```

Null slots are skipped in the renderer (Feature 02).

---

## Handler

```js
function handleMergeCells() {
  if (!activeLayout || selectedCells.length < 2) return;
  if (!areCellsNeighboring(selectedCells, activeLayout.cells)) return;

  const parentCells = findCommonParentCells(activeLayout.cells, selectedCells);
  if (!parentCells) return;

  // Collect positions of selected cells within parentCells
  const positions = [];
  parentCells.forEach((row, rIdx) => {
    (row || []).forEach((cell, cIdx) => {
      if (cell && selectedCells.includes(cell.id)) {
        positions.push({ row: rIdx, col: cIdx });
      }
    });
  });

  if (positions.length !== selectedCells.length) return;

  const sameRow = positions.every(p => p.row === positions[0].row);
  const sameCol = positions.every(p => p.col === positions[0].col);
  if (!sameRow && !sameCol) return;

  const isTopLevel = parentCells === activeLayout.cells;
  let newParentCells;
  let layoutDimUpdates = {};

  if (sameRow) {
    const rowIndex = positions[0].row;
    const cols = positions.map(p => p.col).sort((a, b) => a - b);
    const startCol = cols[0];
    const spanCols = cols.length;
    const mergedCell = {
      id: crypto.randomUUID(),
      itemKey: null,
      subdivisions: null,
      colSpan: spanCols,
      rowSpan: 1,
      alignItems: 'center',
      justifyContent: 'center',
    };

    // Only modify the row being merged — other rows are untouched
    newParentCells = parentCells.map((r, rIdx) => {
      if (rIdx !== rowIndex) return r;
      const nr = [...r];
      nr.splice(startCol, spanCols, mergedCell);
      return nr;
    });

    if (isTopLevel) {
      layoutDimUpdates.cols = (activeLayout.cols || parentCells[0]?.length || 0) - (spanCols - 1);
    }

  } else {
    // sameCol
    const colIndex = positions[0].col;
    const rows = positions.map(p => p.row).sort((a, b) => a - b);
    const startRow = rows[0];
    const spanRows = rows.length;
    const mergedCell = {
      id: crypto.randomUUID(),
      itemKey: null,
      subdivisions: null,
      colSpan: 1,
      rowSpan: spanRows,
      alignItems: 'center',
      justifyContent: 'center',
    };

    newParentCells = parentCells.map((r, rIdx) => {
      const nr = [...r];
      if (rIdx === startRow) {
        nr.splice(colIndex, 1, mergedCell);
        return nr;
      }
      if (rIdx > startRow && rIdx < startRow + spanRows) {
        nr.splice(colIndex, 1, null);   // mark spanned slot as null
        return nr;
      }
      return r;
    });
  }

  const newTopCells = isTopLevel
    ? newParentCells
    : replaceCellsArrayInTree(activeLayout.cells, parentCells, newParentCells);

  const newLayout = { ...activeLayout, cells: newTopCells, ...layoutDimUpdates };
  const updated = layouts.map(l => l.id === activeLayoutId ? newLayout : l);
  setLayouts(updated);
  persistLayouts(updated);
  setSelectedCells([]);
}
```

---

## replaceCellsArrayInTree helper (module-level, pure function)

```js
/**
 * Recursively replaces a specific cells 2D array (identified by reference)
 * with newCells inside the full cell tree. Returns a new tree.
 */
function replaceCellsArrayInTree(cells, targetCells, newCells) {
  if (cells === targetCells) return newCells;
  return cells.map(row =>
    (row || []).map(cell => {
      if (!cell || !cell.subdivisions) return cell;
      const replaced = replaceCellsArrayInTree(cell.subdivisions.cells, targetCells, newCells);
      if (replaced === cell.subdivisions.cells) return cell;
      return { ...cell, subdivisions: { ...cell.subdivisions, cells: replaced } };
    })
  );
}
```

---

## Key Correctness Points

1. **Horizontal merge (sameRow):** Only splice the merged row. Do not touch other rows. CSS Grid handles `colSpan` — no null placeholders needed in other rows.
2. **Vertical merge (sameCol):** Use `null` to mark spanned slots in subsequent rows so the renderer skips them correctly.
3. **No silent failures:** If `areCellsNeighboring` returns false, the handler returns early but the `canMerge` derived value should already have kept the button disabled — the user should never reach this case.
4. **No guards based on cell content:** Cells with items or subdivisions are mergeable. Their content is simply discarded.

---

## Acceptance Criteria

- [ ] Merge button enabled when 2+ adjacent cells in same row or column are selected
- [ ] Horizontal merge collapses cells into one with correct `colSpan`
- [ ] Vertical merge collapses cells into one with correct `rowSpan` and null placeholder slots
- [ ] Other rows/columns are NOT modified during a horizontal merge
- [ ] Merged cell always has `itemKey: null` and `subdivisions: null`
- [ ] Merge works for sub-cells inside a subdivision (not only top-level)
- [ ] Selection is cleared after merge
- [ ] Layout is persisted after merge
- [ ] No silent failures — if merge is triggered, it completes or logs a console error
