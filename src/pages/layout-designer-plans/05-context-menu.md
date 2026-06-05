# Feature 05 — Context Menu & Item Assignment

## Purpose
Right-clicking a cell opens a context menu with layout-editing actions. The "Add Item" submenu lists available items (those not yet assigned to any cell). Selecting an item assigns it to the cell.

---

## Trigger

Right-click on any selectable (leaf) cell:
```js
onContextMenu={(e) => {
  e.preventDefault();
  e.stopPropagation();
  handleContextMenu(cell.id, e);
}}
```

---

## Context Menu Items

```
Add Item ►              (submenu — only if cell has no item)
  Track Title
  Album Name
  Artist Name
  Bitrate / Sample Rate
  Service Logo
  Player Buttons
  Volume Slider
  Volume Button
  Track Progress Bar
  Control Buttons
  Visualization
  Player (Vinyl/CD)
──────────────────
Remove Item             (only if cell has an item)
──────────────────
Split into Rows         (only if cell has no subdivisions)
Split into Columns      (only if cell has no subdivisions)
──────────────────
Merge                   (only if canMerge)
──────────────────
Remove Cell             (always, with caveats — see below)
```

### "Add Item" submenu
- Lists only items not already assigned to any cell in the layout
- Each item is a clickable menu entry
- On click: `handleAssignItem(itemKey, cellId)` → sets `cell.itemKey = itemKey`, persists
- If ALL items are already assigned, show "Add Item" as disabled (no submenu)

### "Remove Item"
- Shown only when `cell.itemKey !== null`
- On click: `handleClearCell(cellId)` → sets `cell.itemKey = null`, persists
- The item returns to the available items list

### Split into Rows / Split into Columns
- Shown only when cell has no subdivisions
- Same actions as toolbar buttons (Feature 04)

### Merge
- Shown only when `canMerge` is true (2+ cells selected including this one)
- Same action as toolbar Merge

### Remove Cell
- Always shown
- If the layout would become entirely empty (removing the last cell): show a brief error toast and cancel
- On a top-level cell: replaces cell with `null` in the cells array (creates a "gap" that the grid ignores)
- On a sub-cell: sets that slot to `null` inside its parent subdivision
- **Warning:** Removing a cell that has an item discards the item (no confirmation needed — this is a quick destructive action consistent with design tools)

---

## State

```js
const [contextMenu, setContextMenu] = useState(null);
// shape: { cellId: string, x: number, y: number }
```

---

## Handler

```js
function handleContextMenu(cellId, event) {
  // Right-clicking a cell also selects it (single select)
  setSelectedCells([cellId]);
  setContextMenu({ cellId, x: event.clientX, y: event.clientY });
}

function closeContextMenu() {
  setContextMenu(null);
  // Do NOT clear selectedCells here — user may continue with toolbar actions
}
```

Close on:
- Clicking anywhere outside the menu
- Pressing Escape
- Selecting any menu item

---

## Available Items Computation

```js
const LAYOUT_ITEMS = {
  trackName: 'Track Title',
  albumName: 'Album Name',
  artistName: 'Artist Name',
  samplingRate: 'Bitrate / Sample Rate',
  serviceLogo: 'Service Logo',
  playerControls: 'Player Buttons',
  volumeSlider: 'Volume Slider',
  volumeButton: 'Volume Button',
  progressBar: 'Track Progress Bar',
  buttonRow: 'Control Buttons',
  viz: 'Visualization',
  player: 'Player (Vinyl/CD)',
};

function getAssignedItemKeys(cells) {
  const keys = new Set();
  if (!cells) return keys;
  cells.forEach(row => (row || []).forEach(cell => {
    if (!cell) return;
    if (cell.itemKey) keys.add(cell.itemKey);
    if (cell.subdivisions) {
      getAssignedItemKeys(cell.subdivisions.cells).forEach(k => keys.add(k));
    }
  }));
  return keys;
}

// Computed in useMemo:
const assignedItemKeys = useMemo(() => getAssignedItemKeys(activeLayout?.cells), [activeLayout]);
const availableItems = useMemo(
  () => Object.entries(LAYOUT_ITEMS).filter(([key]) => !assignedItemKeys.has(key)),
  [assignedItemKeys]
);
```

---

## handleAssignItem

```js
function handleAssignItem(itemKey, cellId) {
  const newCells = updateCellById(activeLayout.cells, cellId, { itemKey });
  const newLayout = { ...activeLayout, cells: newCells };
  const updated = layouts.map(l => l.id === activeLayoutId ? newLayout : l);
  setLayouts(updated);
  persistLayouts(updated);
  closeContextMenu();
}
```

---

## updateCellById helper (module-level, pure function)

```js
/**
 * Recursively finds cell by id and applies updates (shallow merge).
 * Returns a new cells 2D array (immutable update).
 */
function updateCellById(cells, cellId, updates) {
  return cells.map(row =>
    (row || []).map(cell => {
      if (!cell) return cell;
      if (cell.id === cellId) return { ...cell, ...updates };
      if (cell.subdivisions) {
        return {
          ...cell,
          subdivisions: {
            ...cell.subdivisions,
            cells: updateCellById(cell.subdivisions.cells, cellId, updates),
          },
        };
      }
      return cell;
    })
  );
}
```

---

## Context Menu Rendering

Position absolutely at `{ top: contextMenu.y, left: contextMenu.x }`. Clamp to viewport so it doesn't overflow.

```jsx
{contextMenu && (
  <div
    className="layout-context-menu"
    style={{ position: 'fixed', top: contextMenu.y, left: contextMenu.x, zIndex: 9999 }}
    onMouseLeave={closeContextMenu}
  >
    {/* Add Item submenu */}
    {!contextCellObj?.itemKey && availableItems.length > 0 && (
      <div className="layout-context-menu__item layout-context-menu__item--submenu">
        Add Item ▶
        <div className="layout-context-menu__submenu">
          {availableItems.map(([key, label]) => (
            <div key={key} className="layout-context-menu__item" onClick={() => handleAssignItem(key, contextMenu.cellId)}>
              {label}
            </div>
          ))}
        </div>
      </div>
    )}

    {contextCellObj?.itemKey && (
      <div className="layout-context-menu__item" onClick={() => { handleClearCell(contextMenu.cellId); closeContextMenu(); }}>
        Remove Item
      </div>
    )}

    {/* Divider, Split, Merge, Remove Cell ... */}
  </div>
)}
```

---

## Styles (layout-designer.scss)

```scss
.layout-context-menu {
  background: var(--bs-body-bg);
  border: 1px solid var(--bs-border-color);
  border-radius: var(--bs-border-radius);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  min-width: 180px;
  padding: 4px 0;
  font-size: 0.875rem;
  user-select: none;

  &__item {
    padding: 6px 16px;
    cursor: pointer;
    position: relative;
    &:hover { background: rgba(var(--bs-primary-rgb), 0.1); }
    &--disabled { opacity: 0.4; pointer-events: none; }
    &--submenu { padding-right: 8px; }
  }

  &__submenu {
    display: none;
    position: absolute;
    left: 100%;
    top: 0;
    background: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: var(--bs-border-radius);
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    min-width: 180px;
    padding: 4px 0;
  }

  &__item--submenu:hover &__submenu {
    display: block;
  }

  hr {
    margin: 4px 0;
    border-color: var(--bs-border-color);
  }
}
```

---

## Acceptance Criteria

- [ ] Right-clicking a cell opens context menu at cursor position
- [ ] Context menu closes on outside click or Escape
- [ ] "Add Item" submenu lists only unassigned items
- [ ] Selecting an item assigns it to the cell and closes the menu
- [ ] "Remove Item" only shown when cell has an item
- [ ] Assigned item disappears from submenu across all cells
- [ ] Removing item from cell re-adds it to the submenu
- [ ] "Remove Cell" works for both top-level and sub-cells
- [ ] Removing last cell shows error and cancels
- [ ] Context menu does NOT clear selectedCells when it closes
