# Feature 09 — Persist & Load Config

## Purpose
All layout changes are instantly saved to the Volumio plugin config via socket. On mount, existing layouts are loaded from config.

---

## Socket Events

### Save (emit)
```js
socket.emit('callMethod', {
  endpoint: 'user_interface/stylish_player',
  method: 'configSaveLayoutDesigner',
  data: JSON.stringify(layouts),
});
```

Call `persistLayouts(layouts)` after every mutation. Use a stable `useCallback` wrapping this.

### Load (emit + listen)
```js
// On mount:
socket.emit('callMethod', {
  endpoint: 'user_interface/stylish_player',
  method: 'getLayoutDesigner',
  data: {},
});

// Listen for response:
socket.on('pushLayoutDesigner', (response) => {
  const raw = response?.value ?? '[]';
  try {
    const parsed = JSON.parse(raw);
    setLayouts(Array.isArray(parsed) ? parsed : []);
  } catch {
    setLayouts([]);
  }
});
```

Remove the listener on unmount:
```js
useEffect(() => {
  socket.emit('callMethod', { endpoint: 'user_interface/stylish_player', method: 'getLayoutDesigner', data: {} });
  socket.on('pushLayoutDesigner', handler);
  return () => socket.off('pushLayoutDesigner', handler);
}, []);
```

---

## persistLayouts

```js
const persistLayouts = useCallback((layoutsToPersist) => {
  socket.emit('callMethod', {
    endpoint: 'user_interface/stylish_player',
    method: 'configSaveLayoutDesigner',
    data: JSON.stringify(layoutsToPersist),
  });
}, [socket]);
```

**Rules:**
- Always pass the FULL updated layouts array (not a single layout)
- Call AFTER `setLayouts` (call both sequentially, not inside the updater)
- Do NOT call inside `setLayouts(prev => ...)` updater functions — side effects in updaters cause issues in React Strict Mode

**Correct pattern:**
```js
const updated = layouts.map(l => l.id === activeLayoutId ? newLayout : l);
setLayouts(updated);          // 1. update state
persistLayouts(updated);      // 2. persist (same array reference)
```

---

## Backend (index.js — plugin)

The plugin must implement:

```js
// GET
self.getLayoutDesigner = function() {
  var value = self.config.get('layoutDesigner') || '[]';
  self.commandRouter.pushToastMessage('info', 'Layout Designer', 'Loading layouts');
  defer.resolve({ value });
};

// SAVE
self.configSaveLayoutDesigner = function(data) {
  self.config.set('layoutDesigner', data);
  // No toast needed — save is continuous/silent
  defer.resolve({});
};
```

The `layoutDesigner` config key stores the full JSON-stringified array.

---

## Parsing on Load

```js
function parseLayoutDesignerConfig(raw) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
```

---

## Active Layout Selection

On load:
- If there are layouts, set `activeLayoutId` to the first one
- If no layouts, set `activeLayoutId` to null and show empty state

When `activeLayoutId` becomes invalid (e.g., after delete):
```js
useEffect(() => {
  if (!layouts.length) {
    setActiveLayoutId(null);
    return;
  }
  if (!layouts.some(l => l.id === activeLayoutId)) {
    setActiveLayoutId(layouts[0].id);
  }
}, [layouts]);
```

---

## Acceptance Criteria

- [ ] On mount, `getLayoutDesigner` is emitted and layouts are loaded from `pushLayoutDesigner`
- [ ] Socket listener is cleaned up on unmount
- [ ] Every layout mutation calls `persistLayouts` with the full updated array
- [ ] `persistLayouts` is never called inside a `setLayouts` updater
- [ ] Config key `layoutDesigner` stores the full JSON
- [ ] Bad/missing config gracefully returns empty array (no crash)
- [ ] `activeLayoutId` auto-corrects after layout deletion
