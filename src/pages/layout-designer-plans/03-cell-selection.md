# Feature 03 — Cell Selection

## Purpose
Allow users to select one or more adjacent cells by clicking. Selected cells are visually highlighted. The selection drives which toolbar buttons are enabled.

---

## Rules

| Interaction | Result |
|-------------|--------|
| Click a cell | Select only that cell (deselect all others) |
| Ctrl+Click / Cmd+Click a cell | Add to or remove from selection (multi-select) |
| Click background (grid area) | Deselect all |
| Click a cell that is already the only selected cell | Keep it selected (do not deselect) |
| Click a cell already in multi-selection | Remove it from selection |
| Cells with subdivisions (parent cells) | Not selectable; only leaf cells inside are selectable |

---

## Adjacency Rule (for multi-select)

When the user Ctrl+clicks a cell, it is only added if it is "adjacent" to the existing selection. Adjacent means:

> All selected cells must share the same parent cells array (at any nesting depth), AND they must form a contiguous run either in the same row or the same column.

This prevents selection of cells that could never be merged.

**Note:** The adjacency check is primarily important for enabling the Merge button (Feature 07). Selection itself should still be additive — do not prevent the click from adding a cell; instead, simply keep `canMerge` false if the resulting selection is non-adjacent.

Simpler approach (recommended):
- Allow Ctrl+click on any cell (no gatekeeping at selection time)
- Compute `canMerge` in a derived value that checks adjacency post-selection
- This avoids complex pre-validation logic and is more intuitive

---

## State

```js
const [selectedCells, setSelectedCells] = useState([]);  // array of cell IDs (strings)
```

Derived:
```js
const selectedCellId = selectedCells.length === 1 ? selectedCells[0] : null;
const selectedCellObj = useMemo(() => findCellById(activeLayout?.cells, selectedCellId), [activeLayout, selectedCellId]);
const canSplit = !!selectedCellObj && !selectedCellObj.subdivisions;
const canMerge = selectedCells.length >= 2 && areCellsNeighboring(selectedCells, activeLayout?.cells);
const canClear = !!selectedCellObj && !!selectedCellObj.itemKey;
const canAlign = !!selectedCellObj;
```

---

## Handler

```js
function handleCellClick(cellId, event) {
  const isMultiSelect = !!(event.ctrlKey || event.metaKey);
  setSelectedCells(prev => {
    if (!isMultiSelect) {
      // Single click — select only this cell
      return [cellId];
    }
    // Multi-select toggle
    if (prev.includes(cellId)) {
      return prev.filter(id => id !== cellId);
    }
    return [...prev, cellId];
  });
}
```

**Important:** Capture `event.ctrlKey / event.metaKey` BEFORE calling `setSelectedCells` — reading event properties inside a state updater function is unreliable (event may be pooled).

---

## findCellById helper (module-level, pure function)

```js
function findCellById(cells, cellId) {
  if (!cells || !cellId) return null;
  for (const row of cells) {
    if (!row) continue;
    for (const cell of row) {
      if (!cell) continue;
      if (cell.id === cellId) return cell;
      if (cell.subdivisions) {
        const found = findCellById(cell.subdivisions.cells, cellId);
        if (found) return found;
      }
    }
  }
  return null;
}
```

---

## areCellsNeighboring helper (module-level, pure function)

```js
/**
 * Returns true if all cellIds are immediate siblings in the same parent cells array
 * AND they form a contiguous run in a single row or single column.
 */
function areCellsNeighboring(cellIds, topCells) {
  if (cellIds.length < 2) return false;
  const parent = findCommonParentCells(topCells, cellIds);
  if (!parent) return false;

  const positions = [];
  parent.forEach((row, rIdx) => {
    (row || []).forEach((cell, cIdx) => {
      if (cell && cellIds.includes(cell.id)) positions.push({ r: rIdx, c: cIdx });
    });
  });

  if (positions.length !== cellIds.length) return false;

  const sameRow = positions.every(p => p.r === positions[0].r);
  const sameCol = positions.every(p => p.c === positions[0].c);
  if (!sameRow && !sameCol) return false;

  const sorted = sameRow
    ? [...positions].sort((a, b) => a.c - b.c)
    : [...positions].sort((a, b) => a.r - b.r);

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (sameRow && curr.c !== prev.c + 1) return false;
    if (sameCol && curr.r !== prev.r + 1) return false;
  }
  return true;
}
```

---

## findCommonParentCells helper (module-level, pure function)

```js
/**
 * Returns the cells 2D array that directly contains ALL given cellIds as immediate children.
 * Searches recursively at any nesting depth.
 */
function findCommonParentCells(cells, cellIds) {
  if (!cells) return null;

  // Check if this cells array directly contains all of the ids
  const directChildren = new Set();
  cells.forEach(row => (row || []).forEach(cell => cell && directChildren.add(cell.id)));
  if (cellIds.every(id => directChildren.has(id))) return cells;

  // Recurse into subdivisions
  for (const row of cells) {
    for (const cell of (row || [])) {
      if (cell?.subdivisions) {
        const found = findCommonParentCells(cell.subdivisions.cells, cellIds);
        if (found) return found;
      }
    }
  }
  return null;
}
```

---

## Visual Styles

Applied to `.layout-cell--selected` (in `layout-designer.scss`):

```scss
.layout-cell--selected {
  border: 2px solid var(--bs-primary) !important;
  background: rgba(var(--bs-primary-rgb), 0.15) !important;

  // Checkmark overlay (top-right corner)
  &::after {
    content: '✓';
    position: absolute;
    top: 2px;
    right: 4px;
    font-size: 0.65rem;
    color: var(--bs-primary);
    pointer-events: none;
  }
}
```

---

## Acceptance Criteria

- [ ] Clicking a cell selects it and deselects all others
- [ ] Ctrl+Click adds/removes a cell from the selection
- [ ] Clicking the background deselects all
- [ ] Parent cells (with subdivisions) are NOT selectable
- [ ] `selectedCellObj` always resolves correctly, including cells inside subdivisions
- [ ] `canMerge` is true only when 2+ cells are adjacent (same parent, contiguous row or column)
- [ ] `canSplit`, `canClear`, `canAlign` derived values update correctly
- [ ] Capturing ctrlKey outside updater (no stale event reads)
