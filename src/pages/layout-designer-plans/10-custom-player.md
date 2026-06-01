# Feature 10 — Custom Player Integration

## Purpose
When `useCustomLayout` is enabled in plugin settings, the player screen uses a `CustomPlayer.jsx` component that dynamically renders the active layout for the current screen resolution. Falls back to the standard responsive player if no matching layout is found.

---

## Config Setting

Add `useCustomLayout` (boolean, default `false`) to `UIConfig.json`:

```json
{
  "id": "useCustomLayout",
  "element": "switch",
  "label": "Use Custom Layout",
  "value": false
}
```

Load in `Player.jsx`:
```js
const useCustomLayout = useConfig('useCustomLayout', false);
```

---

## Fallback Logic in Player.jsx

```jsx
// Player.jsx
const windowSize = useWindowSize();  // returns { width, height }

const matchingLayout = useMemo(() => {
  if (!useCustomLayout || !layouts?.length) return null;
  // Find layouts matching the current screen resolution
  const matches = layouts.filter(
    l => l.width === windowSize.width && l.height === windowSize.height
  );
  if (!matches.length) return null;
  // Prefer the one marked isDefault; fall back to first match
  return matches.find(l => l.isDefault) || matches[0];
}, [useCustomLayout, layouts, windowSize]);

// In render:
if (matchingLayout) {
  return <CustomPlayer layout={matchingLayout} />;
}
return <StandardPlayer />;  // existing responsive player
```

---

## CustomPlayer.jsx

```jsx
// src/components/CustomPlayer.jsx
import PropTypes from 'prop-types';

const ITEM_RENDERERS = {
  trackName: ({ playerState }) => <TrackTitle title={playerState?.title} />,
  albumName: ({ playerState }) => <AlbumName album={playerState?.album} />,
  artistName: ({ playerState }) => <ArtistName artist={playerState?.artist} />,
  samplingRate: ({ playerState }) => <SamplingRate playerState={playerState} />,
  serviceLogo: ({ playerState }) => <ServiceLogo service={playerState?.service} />,
  playerControls: ({ playerState, actions }) => <PlayerControls playerState={playerState} {...actions} />,
  volumeSlider: () => <VolumeManager />,
  volumeButton: () => <VolumeManager vertical />,
  progressBar: () => <PlayerSeekbar />,
  buttonRow: () => <ButtonRow />,
  viz: () => <VisualizationPanel />,
  player: ({ playerState }) => <PlayerDisc playerState={playerState} />,
};

function renderCustomCell(cell, props) {
  if (!cell) return null;

  const style = {
    gridColumn: `span ${cell.colSpan || 1}`,
    gridRow: `span ${cell.rowSpan || 1}`,
    display: 'flex',
    alignItems: cell.alignItems || 'center',
    justifyContent: cell.justifyContent || 'center',
    overflow: 'hidden',
    minWidth: 0,
    minHeight: 0,
  };

  if (cell.subdivisions) {
    const { rows, cols, rowFractions, colFractions, cells } = cell.subdivisions;
    return (
      <div key={cell.id} style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: (colFractions || Array(cols).fill(1)).map(f => `${f}fr`).join(' '),
        gridTemplateRows: (rowFractions || Array(rows).fill(1)).map(f => `${f}fr`).join(' '),
      }}>
        {cells.flatMap((row, rIdx) =>
          (row || []).map((subCell, cIdx) => subCell ? renderCustomCell(subCell, props) : null)
        )}
      </div>
    );
  }

  const Renderer = cell.itemKey ? ITEM_RENDERERS[cell.itemKey] : null;
  return (
    <div key={cell.id} style={style}>
      {Renderer ? <Renderer {...props} /> : null}
    </div>
  );
}

export default function CustomPlayer({ layout }) {
  const playerState = usePlayerState();
  const actions = usePlayerActions();

  const colTemplate = (layout.colFractions || Array(layout.cols).fill(1)).map(f => `${f}fr`).join(' ');
  const rowTemplate = (layout.rowFractions || Array(layout.rows).fill(1)).map(f => `${f}fr`).join(' ');

  const props = { playerState, actions };

  return (
    <div
      className="custom-player"
      style={{
        display: 'grid',
        gridTemplateColumns: colTemplate,
        gridTemplateRows: rowTemplate,
        width: '100%',
        height: '100%',
      }}
    >
      {layout.cells.flatMap((row, rIdx) =>
        (row || []).map((cell, cIdx) => cell ? renderCustomCell(cell, props) : null)
      )}
    </div>
  );
}

CustomPlayer.propTypes = {
  layout: PropTypes.shape({
    id: PropTypes.string.isRequired,
    cols: PropTypes.number,
    rows: PropTypes.number,
    colFractions: PropTypes.arrayOf(PropTypes.number),
    rowFractions: PropTypes.arrayOf(PropTypes.number),
    cells: PropTypes.array.isRequired,
  }).isRequired,
};
```

---

## Layout Loading in Player

Layouts must be available in `Player.jsx`. Options:
1. **From LayoutDesigner context** — share layouts via React Context (clean but adds complexity)
2. **Load in Player.jsx directly** — emit `getLayoutDesigner` on mount and listen for `pushLayoutDesigner`
3. **From global app state / Zustand** — if such store exists

Recommended: **Option 2** — Player loads layouts independently on mount. Layouts are small data and the load is fast.

```js
const [layouts, setLayouts] = useState([]);
useEffect(() => {
  socket.emit('callMethod', { endpoint: 'user_interface/stylish_player', method: 'getLayoutDesigner', data: {} });
  const handler = (res) => {
    try { setLayouts(JSON.parse(res?.value ?? '[]') || []); } catch { setLayouts([]); }
  };
  socket.on('pushLayoutDesigner', handler);
  return () => socket.off('pushLayoutDesigner', handler);
}, [socket]);
```

---

## useWindowSize Hook

If not already defined:
```js
// src/hooks/useWindowSize.js
import { useState, useEffect } from 'react';

export function useWindowSize() {
  const [size, setSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return size;
}
```

---

## Acceptance Criteria

- [ ] `useCustomLayout` setting exists in UIConfig.json and is loaded in Player.jsx
- [ ] When `useCustomLayout` is false, standard player renders as before
- [ ] When `useCustomLayout` is true and a matching layout exists, `CustomPlayer` renders
- [ ] Layout matching uses both width AND height of the viewport
- [ ] `isDefault` layout is preferred among multiple matches
- [ ] If no layout matches, falls back to standard player (no error)
- [ ] `CustomPlayer` renders CSS Grid correctly using `fr` fractions
- [ ] Each cell renders its assigned item component
- [ ] Cells with subdivisions render nested grids
- [ ] Null slots (from rowSpan) are skipped without error
- [ ] `colSpan` and `rowSpan` are applied correctly to grid items
