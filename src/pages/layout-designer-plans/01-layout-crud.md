# Feature 01 — Layout CRUD & Selector

## Purpose
Allow users to create, name, edit, and delete named layouts scoped to screen resolutions. This is the entry point of the designer page.

---

## UI Structure

```
LayoutDesigner page (full page, no dialog yet)
├── Page heading: "Layout Designer"
├── Layout Selector Row
│   ├── <select> dropdown — lists all layouts (label: "name — WxH")
│   ├── Button: "Edit Layout" (opens Grid Canvas Dialog, Feature 02)
│   ├── Button: "Set as Default" (marks layout.isDefault = true)
│   └── Button: "Delete" (with confirmation, destructive)
├── Button: "+ New Layout" (opens Create Layout form/modal)
└── (empty state message when no layouts exist)
```

---

## Create Layout

**Trigger:** Click "+ New Layout"

**Form fields:**
- Name (text, required, unique per resolution group)
- Width (number, px, required, > 0)
- Height (number, px, required, > 0)

**Validation:**
- Name must not be empty
- Name must be unique among all layouts (not just same resolution) — simpler UX
- Width and Height must be positive integers

**On submit:**
- Generate a UUID for `id`
- Create initial layout object:
  ```js
  {
    id: uuid(),
    name,
    width: Number(width),
    height: Number(height),
    isDefault: false,
    rows: 1,
    cols: 1,
    rowFractions: [1],
    colFractions: [1],
    cells: [[{ id: uuid(), itemKey: null, subdivisions: null, colSpan: 1, rowSpan: 1, alignItems: 'center', justifyContent: 'center' }]]
  }
  ```
- Add to layouts array, select it as activeLayoutId
- Persist immediately
- Open Grid Canvas Dialog automatically (Feature 02)

---

## Edit Layout Metadata

**Trigger:** Select a layout in dropdown, then click pencil/edit icon or inline edit fields.

**Editable fields:** Name, Width, Height (same validation as create).

**Implementation:** Inline inputs below the dropdown, pre-filled with active layout values. Changes persist on blur/Enter.

---

## Set as Default

**Trigger:** Click "Set as Default" button.

**Behaviour:**
- Sets `isDefault: true` on the selected layout
- Sets `isDefault: false` on all other layouts with the same width+height
- Persist

**Visual indicator:** Show a star icon or "(default)" badge on the selected dropdown option.

---

## Delete Layout

**Trigger:** Click "Delete" button.

**Behaviour:**
- Show a confirmation prompt (e.g., a small Bootstrap modal or `window.confirm` for simplicity)
- On confirm: remove layout from array, persist
- If deleted layout was active: select first remaining layout, or set activeLayoutId to null if none left
- If deleted layout was the default: no auto-reassignment (user must explicitly set a new default)

---

## State

```js
const [layouts, setLayouts] = useState([]);         // all layouts
const [activeLayoutId, setActiveLayoutId] = useState(null);
const [showCreateForm, setShowCreateForm] = useState(false);
const [nameInput, setNameInput] = useState('');
const [widthInput, setWidthInput] = useState('');
const [heightInput, setHeightInput] = useState('');
```

---

## Persistence (see Feature 09)

After every mutation call `persistLayouts(layouts)`:
```js
socket.emit('callMethod', {
  endpoint: 'user_interface/stylish_player',
  method: 'configSaveLayoutDesigner',
  data: JSON.stringify(layouts)
});
```

On mount, load existing layouts:
```js
socket.emit('callMethod', {
  endpoint: 'user_interface/stylish_player',
  method: 'getLayoutDesigner',
  data: {}
});
socket.on('pushLayoutDesigner', (data) => {
  const parsed = JSON.parse(data.value || '[]');
  setLayouts(Array.isArray(parsed) ? parsed : []);
});
```

---

## Error States

| Condition | Message |
|-----------|---------|
| Duplicate name | "A layout with this name already exists." |
| Empty name | "Name is required." |
| Invalid width/height | "Must be a positive number." |

---

## Acceptance Criteria

- [ ] "+ New Layout" opens a form with Name, Width, Height
- [ ] Submitting creates a layout and immediately opens the grid dialog
- [ ] Dropdown lists all layouts, selecting changes activeLayout
- [ ] Editing name/width/height updates and persists the layout
- [ ] "Set as Default" marks the layout and persists
- [ ] "Delete" shows confirmation before removing
- [ ] Empty state shown when no layouts exist
- [ ] All mutations persist immediately via socket
