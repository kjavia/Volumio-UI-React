# Feature 04 — Toolbar

## Purpose
A sticky toolbar at the top of the Grid Canvas Dialog that provides the primary layout editing actions. Button enabled/disabled state is derived from the current cell selection.

---

## Toolbar Layout

```
[ Split ↕ Rows ] [ Split ↔ Cols ] [ Merge ] [ Clear ] | [ Align ↑ ] [ Align → ] ... | [ Close ]
                                                         ^-- only shown when 1 cell is selected
```

Toolbar is rendered as a flexbox row with `gap-2` and `flex-wrap: wrap`. The alignment group only renders when a single cell with an item is selected.

---

## Buttons

### Split into Rows
- **Icon:** horizontal split icon or "↕ Split Rows"
- **Enabled:** `canSplit` (exactly 1 cell selected, no subdivisions)
- **Action:** `handleSplitCellIntoRows(selectedCellId)`
- **Result:** The selected cell gains `subdivisions: { rows: 2, cols: 1, ... }` with 2 sub-cells

### Split into Columns
- **Icon:** vertical split icon or "↔ Split Cols"
- **Enabled:** `canSplit`
- **Action:** `handleSplitCellIntoColumns(selectedCellId)`
- **Result:** The selected cell gains `subdivisions: { rows: 1, cols: 2, ... }` with 2 sub-cells

### Merge
- **Icon:** merge icon or "⊞ Merge"
- **Enabled:** `canMerge` (2+ cells selected, adjacent, same parent)
- **Action:** `handleMergeCells()`
- **Result:** Selected cells collapse into a single cell with `colSpan` or `rowSpan`

### Clear Cell
- **Icon:** ✕ or "Clear"
- **Enabled:** `canClear` (1 cell selected, has an itemKey)
- **Action:** `handleClearCell(selectedCellId)`
- **Result:** `cell.itemKey = null`

### Alignment Buttons (grouped, shown only when `canAlign`)
Shown as a button group only when exactly 1 cell is selected (with or without an item):

**alignItems (vertical axis):**

| Button | Value | Label |
|--------|-------|-------|
| Align Top | `'flex-start'` | ↑ |
| Align Middle | `'center'` | ↕ |
| Align Bottom | `'flex-end'` | ↓ |

**justifyContent (horizontal axis):**

| Button | Value | Label |
|--------|-------|-------|
| Align Left | `'flex-start'` | ← |
| Align Center | `'center'` | ↔ |
| Align Right | `'flex-end'` | → |

Active alignment button is visually highlighted (`btn-primary` vs `btn-outline-primary`).

Action: `handleSetCellAlignment(selectedCellId, 'alignItems' | 'justifyContent', value)`

### Close
- Always visible, always enabled
- Action: close dialog, clear selected cells

---

## Disabled Button Behaviour

Use `disabled` attribute. Disabled buttons are visually dimmed and unclickable. Do NOT hide them — showing disabled buttons teaches users what actions are possible.

---

## Handler Signatures

```js
handleSplitCellIntoRows(cellId: string): void
handleSplitCellIntoColumns(cellId: string): void
handleMergeCells(): void         // uses selectedCells from state
handleClearCell(cellId: string): void
handleSetCellAlignment(cellId: string, prop: 'alignItems'|'justifyContent', value: string): void
```

All handlers call `persistLayouts(updatedLayouts)` after state update.

---

## JSX Sketch

```jsx
<div className="layout-toolbar d-flex align-items-center gap-2 p-2 border-bottom flex-wrap">
  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={!canSplit}
    onClick={() => handleSplitCellIntoRows(selectedCellId)}
    title="Split into rows"
  >↕ Rows</button>

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={!canSplit}
    onClick={() => handleSplitCellIntoColumns(selectedCellId)}
    title="Split into columns"
  >↔ Cols</button>

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={!canMerge}
    onClick={handleMergeCells}
    title="Merge selected cells"
  >⊞ Merge</button>

  <button
    className="btn btn-sm btn-outline-secondary"
    disabled={!canClear}
    onClick={() => handleClearCell(selectedCellId)}
    title="Clear cell content"
  >✕ Clear</button>

  {canAlign && (
    <>
      <div className="vr" />
      <div className="btn-group btn-group-sm" role="group" aria-label="Vertical alignment">
        {['flex-start', 'center', 'flex-end'].map((v, i) => (
          <button
            key={v}
            className={`btn ${selectedCellObj.alignItems === v ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => handleSetCellAlignment(selectedCellId, 'alignItems', v)}
            title={['Top', 'Middle', 'Bottom'][i]}
          >{['↑', '↕', '↓'][i]}</button>
        ))}
      </div>
      <div className="btn-group btn-group-sm" role="group" aria-label="Horizontal alignment">
        {['flex-start', 'center', 'flex-end'].map((v, i) => (
          <button
            key={v}
            className={`btn ${selectedCellObj.justifyContent === v ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => handleSetCellAlignment(selectedCellId, 'justifyContent', v)}
            title={['Left', 'Center', 'Right'][i]}
          >{['←', '↔', '→'][i]}</button>
        ))}
      </div>
    </>
  )}

  <div className="ms-auto">
    <button className="btn btn-sm btn-secondary" onClick={closeDialog}>✕ Close</button>
  </div>
</div>
```

---

## Acceptance Criteria

- [ ] All 5 action buttons render in the toolbar
- [ ] Split buttons disabled unless exactly 1 cell without subdivisions is selected
- [ ] Merge button disabled unless 2+ adjacent cells are selected
- [ ] Clear button disabled unless 1 cell with an item is selected
- [ ] Alignment group only renders when 1 cell is selected
- [ ] Active alignment value is highlighted in the button group
- [ ] Close button is always visible and closes the dialog
- [ ] All buttons trigger correct handler
