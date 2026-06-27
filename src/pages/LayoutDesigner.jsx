import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useSocket } from '@/contexts/SocketContext';
import usePluginConfig from '@/hooks/usePluginConfig';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';
import Dialog from '@/components/Dialog';
import AppMenu from '@/components/AppMenu';
import ContextMenu from '@/components/ContextMenu';
import './layout-designer.scss';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const LAYOUT_ITEMS = {
  trackName: 'Track Title',
  albumName: 'Album Name',
  artistName: 'Artist Name',
  samplingRate: 'Bitrate / Sample Rate',
  serviceLogo: 'Service Logo',
  player: 'Album Art / Graphic',
  playerControls: 'Player Buttons',
  buttonRow: 'Control Buttons',
  buttonShuffle: 'Shuffle',
  buttonRepeat: 'Repeat',
  buttonAddToPlaylist: 'Add to Playlist',
  buttonFavourite: 'Favourite',
  buttonQueue: 'Queue',
  buttonBrowse: 'Browse',
  progressBar: 'Track Progress Bar',
  volumeSlider: 'Volume Slider',
  volumeButton: 'Volume Button',
  viz: 'Visualization',
};

const LAYOUT_ITEM_ICONS = {
  trackName: 'music_note',
  albumName: 'album',
  artistName: 'person',
  samplingRate: 'graphic_eq',
  serviceLogo: 'apps',
  player: 'radio',
  playerControls: 'play_circle',
  buttonRow: 'tune',
  buttonShuffle: 'shuffle',
  buttonRepeat: 'repeat',
  buttonAddToPlaylist: 'playlist_add',
  buttonFavourite: 'favorite',
  buttonQueue: 'queue_music',
  buttonBrowse: 'library_music',
  progressBar: 'linear_scale',
  volumeSlider: 'volume_up',
  volumeButton: 'volume_up',
  viz: 'equalizer',
};

const OTHER_BUTTON_ITEM_KEYS = [
  'buttonShuffle',
  'buttonRepeat',
  'buttonAddToPlaylist',
  'buttonFavourite',
  'buttonQueue',
  'buttonBrowse',
];

const PLAYER_TYPE_OPTIONS = [
  { value: 'albumArt', label: 'Album Art' },
  { value: 'vinyl', label: 'Vinyl' },
  { value: 'vinylCover', label: 'Vinyl Cover' },
  { value: 'cd', label: 'CD' },
  { value: 'cdCover', label: 'CD Cover' },
  { value: 'cassette', label: 'Cassette' },
  { value: 'reelToReel', label: 'Reel to Reel' },
  { value: 'radio', label: 'Radio' },
  { value: 'matchSource', label: 'Match Source' },
  { value: 'random', label: 'Random' },
  { value: 'none', label: 'None' },
];

const VIZ_TYPE_OPTIONS = [
  { value: 'spectrum', label: 'Spectrum Analyzer' },
  { value: 'peppyMeter', label: 'Peppy Meter' },
  { value: 'peppySpectrum', label: 'Peppy Spectrum' },
  { value: 'none', label: 'None' },
];

// ---------------------------------------------------------------------------
// Pure helper functions (module-level — no closures over component state)
// ---------------------------------------------------------------------------

function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts (HTTP)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function makeCell() {
  return {
    id: generateId(),
    itemKey: null,
    subdivisions: null,
    colSpan: 1,
    rowSpan: 1,
    alignItems: 'center',
    justifyContent: 'center',
  };
}

function makeLayout(name, width, height) {
  return {
    id: generateId(),
    name,
    width: Number(width),
    height: Number(height),
    isDefault: false,
    rows: 1,
    cols: 1,
    rowFractions: [1],
    colFractions: [1],
    cells: [[makeCell()]],
  };
}

/** Recursively find a cell by id. Returns the cell object or null. */
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

/** Recursively update a cell by id (immutable). Returns new top-level cells array. */
function updateCellById(cells, cellId, updates) {
  return cells.map((row) =>
    (row || []).map((cell) => {
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
    }),
  );
}

/** Collect all assigned itemKeys from the cell tree. */
function getAssignedItemKeys(cells) {
  const keys = new Set();
  if (!cells) return keys;
  cells.forEach((row) =>
    (row || []).forEach((cell) => {
      if (!cell) return;
      if (cell.itemKey) keys.add(cell.itemKey);
      if (cell.subdivisions) {
        getAssignedItemKeys(cell.subdivisions.cells).forEach((k) => keys.add(k));
      }
    }),
  );
  return keys;
}

/**
 * Returns the cells 2D array that directly contains ALL given cellIds as
 * immediate children, searching recursively at any nesting depth.
 */
function findCommonParentCells(cells, cellIds) {
  if (!cells || !cellIds.length) return null;
  const directChildren = new Set();
  cells.forEach((row) => (row || []).forEach((cell) => cell && directChildren.add(cell.id)));
  if (cellIds.every((id) => directChildren.has(id))) return cells;
  for (const row of cells) {
    for (const cell of row || []) {
      if (cell?.subdivisions) {
        const found = findCommonParentCells(cell.subdivisions.cells, cellIds);
        if (found) return found;
      }
    }
  }
  return null;
}

/**
 * Returns true if all cellIds share the same parent cells array AND form a
 * contiguous run in a single row OR single column.
 */
function areCellsAdjacent(cellIds, topCells) {
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

  const sameRow = positions.every((p) => p.r === positions[0].r);
  const sameCol = positions.every((p) => p.c === positions[0].c);
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

/**
 * Recursively replaces a specific cells 2D array (by reference) inside the tree.
 */
function replaceCellsArrayInTree(cells, targetCells, newCells) {
  if (cells === targetCells) return newCells;
  return cells.map((row) =>
    (row || []).map((cell) => {
      if (!cell || !cell.subdivisions) return cell;
      const replaced = replaceCellsArrayInTree(cell.subdivisions.cells, targetCells, newCells);
      if (replaced === cell.subdivisions.cells) return cell;
      return { ...cell, subdivisions: { ...cell.subdivisions, cells: replaced } };
    }),
  );
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

function useScreenSize() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    function update() {
      setSize({ w: window.innerWidth, h: window.innerHeight });
    }
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function CreateLayoutForm({ onSubmit, onCancel, existingNames }) {
  const screen = useScreenSize();
  const { t } = useTranslation('layoutDesigner');
  const [name, setName] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!name.trim()) e.name = t('error_name_required');
    else if (existingNames.includes(name.trim())) e.name = t('error_name_duplicate');
    if (!width || isNaN(width) || Number(width) <= 0) e.width = t('error_positive_number');
    if (!height || isNaN(height) || Number(height) <= 0) e.height = t('error_positive_number');
    return e;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length) { setErrors(e2); return; }
    onSubmit(name.trim(), width, height);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-3">
        <label className="form-label">{t('label_layout_name')}</label>
        <input
          className={`form-control form-control-sm${errors.name ? ' is-invalid' : ''}`}
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        {errors.name && <div className="invalid-feedback">{errors.name}</div>}
      </div>
      <div className="row g-2 mb-1">
        <div className="col">
          <label className="form-label">{t('label_width_px')}</label>
          <input
            type="number"
            className={`form-control form-control-sm${errors.width ? ' is-invalid' : ''}`}
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            min={1}
          />
          {errors.width && <div className="invalid-feedback">{errors.width}</div>}
        </div>
        <div className="col">
          <label className="form-label">{t('label_height_px')}</label>
          <input
            type="number"
            className={`form-control form-control-sm${errors.height ? ' is-invalid' : ''}`}
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            min={1}
          />
          {errors.height && <div className="invalid-feedback">{errors.height}</div>}
        </div>
      </div>
      <div className="mb-3">
        <small className="text-secondary me-2">
          {t('label_screen_resolution', 'Screen')}: {screen.w}×{screen.h}
        </small>
        <button
          type="button"
          className="btn btn-link btn-sm p-0 text-secondary"
          style={{ fontSize: '0.75rem' }}
          onClick={() => { setWidth(String(screen.w)); setHeight(String(screen.h)); }}
        >
          {t('btn_use_screen_size', 'Use')}
        </button>
      </div>
      <div className="d-flex gap-2 justify-content-end">
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={onCancel}>{t('btn_cancel')}</button>
        <button type="submit" className="btn btn-sm btn-primary">{t('btn_create')}</button>
      </div>
    </form>
  );
}


// ---------------------------------------------------------------------------
// Main LayoutDesigner component
// ---------------------------------------------------------------------------

export default function LayoutDesigner() {
  const { t } = useTranslation('layoutDesigner');
  const { socket } = useSocket();
  const { data: pluginConfig } = usePluginConfig();
  const { toasts, showToast } = useToast();
  const navigate = useNavigate();
  const screen = useScreenSize();

  // ---- State ---------------------------------------------------------------
  const [layouts, setLayouts] = useState([]);
  const [activeLayoutId, setActiveLayoutId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCanvasDialog, setShowCanvasDialog] = useState(false);

  // Inline edit state for active layout metadata
  const [editName, setEditName] = useState('');
  const [editWidth, setEditWidth] = useState('');
  const [editHeight, setEditHeight] = useState('');

  // Canvas / grid state
  const [selectedCells, setSelectedCells] = useState([]);
  const [contextMenu, setContextMenu] = useState(null); // { cellId, x, y }
  // Toggle for the cell dimension labels overlay. Off by default so the
  // labels don't clutter small cells; user can enable for layout debugging.
  const [showDimensions, setShowDimensions] = useState(false);

  // Drag-resize ref (avoids stale closures)
  const dragRef = useRef(null);
  // Hidden file input for JSON import
  const importInputRef = useRef(null);

  // ---- Derived values -------------------------------------------------------
  const activeLayout = useMemo(
    () => layouts.find((l) => l.id === activeLayoutId) ?? null,
    [layouts, activeLayoutId],
  );

  const existingNames = useMemo(() => layouts.map((l) => l.name), [layouts]);

  const colFractions = useMemo(
    () => activeLayout?.colFractions ?? Array(activeLayout?.cols ?? 1).fill(1),
    [activeLayout],
  );
  const rowFractions = useMemo(
    () => activeLayout?.rowFractions ?? Array(activeLayout?.rows ?? 1).fill(1),
    [activeLayout],
  );

  const assignedItemKeys = useMemo(
    () => getAssignedItemKeys(activeLayout?.cells),
    [activeLayout],
  );
  const availableItems = useMemo(
    () => Object.entries(LAYOUT_ITEMS).filter(([key]) => !assignedItemKeys.has(key) && !OTHER_BUTTON_ITEM_KEYS.includes(key)),
    [assignedItemKeys],
  );

  const selectedCellId = selectedCells.length === 1 ? selectedCells[0] : null;
  const selectedCellObj = useMemo(
    () => findCellById(activeLayout?.cells ?? [], selectedCellId),
    [activeLayout, selectedCellId],
  );
  const canSplit = !!selectedCellObj && !selectedCellObj.subdivisions;
  const canMerge = selectedCells.length >= 2 && areCellsAdjacent(selectedCells, activeLayout?.cells ?? []);
  const canClear = !!selectedCellObj && !!selectedCellObj.itemKey;
  const canAlign = !!selectedCellObj;

  // Context menu cell
  const contextCellObj = useMemo(
    () => (contextMenu ? findCellById(activeLayout?.cells ?? [], contextMenu.cellId) : null),
    [contextMenu, activeLayout],
  );
  const canSplitContextCell = !!contextCellObj && !contextCellObj.subdivisions;

  // ---- Sync edit fields when active layout changes -------------------------
  useEffect(() => {
    if (activeLayout) {
      setEditName(activeLayout.name);
      setEditWidth(String(activeLayout.width));
      setEditHeight(String(activeLayout.height));
    }
  }, [activeLayout?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Auto-correct activeLayoutId after deletions -------------------------
  // When there's only one resolution across all saved layouts, prefer the one
  // flagged isDefault so users land on the canonical layout for their device.
  useEffect(() => {
    if (!layouts.length) { setActiveLayoutId(null); return; }
    if (!layouts.some((l) => l.id === activeLayoutId)) {
      const resolutions = new Set(layouts.map((l) => `${l.width}x${l.height}`));
      const pick = resolutions.size === 1
        ? (layouts.find((l) => l.isDefault) ?? layouts[0])
        : layouts[0];
      setActiveLayoutId(pick.id);
    }
  }, [layouts]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Close context menu on outside click ---------------------------------
  // Handled internally by the ContextMenu 'positioned' variant.

  // ---- Load layouts from plugin config (HTTP + pushStylishPlayerConfig) ----
  useEffect(() => {
    const raw = pluginConfig?.layoutDesigner;
    if (!raw) return;
    const arr = Array.isArray(raw.layouts) ? raw.layouts : [];
    setLayouts(arr);
  }, [pluginConfig?.layoutDesigner]);

  // ---- Persist helper ------------------------------------------------------
  const persistLayouts = useCallback(
    (layoutsToPersist) => {
      if (!socket) return;
      socket.emit('callMethod', {
        endpoint: 'user_interface/stylish_player',
        method: 'configSaveLayoutDesigner',
        data: { layoutDesigner: JSON.stringify({ layouts: layoutsToPersist }) },
      });
    },
    [socket],
  );

  // ---- Layout CRUD handlers ------------------------------------------------
  function handleCreateLayout(name, width, height) {
    const isFirstForResolution = !layouts.some(
      (l) => l.width === Number(width) && l.height === Number(height),
    );
    const layout = { ...makeLayout(name, width, height), isDefault: isFirstForResolution };
    const updated = [...layouts, layout];
    setLayouts(updated);
    setActiveLayoutId(layout.id);
    persistLayouts(updated);
    setShowCreateForm(false);
    setShowCanvasDialog(true);
  }

  function handleUpdateLayoutName() {
    if (!activeLayout) return;
    const trimmed = editName.trim();
    if (!trimmed) { setEditName(activeLayout.name); return; }
    if (trimmed !== activeLayout.name && existingNames.includes(trimmed)) {
      showToast('A layout with this name already exists.', 'error');
      setEditName(activeLayout.name);
      return;
    }
    const updated = layouts.map((l) => l.id === activeLayoutId ? { ...l, name: trimmed } : l);
    setLayouts(updated);
    persistLayouts(updated);
  }

  function handleUpdateLayoutDimension(field) {
    if (!activeLayout) return;
    const val = field === 'width' ? editWidth : editHeight;
    const num = Number(val);
    if (!val || isNaN(num) || num <= 0) {
      field === 'width' ? setEditWidth(String(activeLayout.width)) : setEditHeight(String(activeLayout.height));
      return;
    }
    // Compute the new resolution after the change
    const newW = field === 'width' ? num : activeLayout.width;
    const newH = field === 'height' ? num : activeLayout.height;
    // If this layout is the default and the target resolution already has another default, demote it
    const newResAlreadyHasDefault = activeLayout.isDefault && layouts.some(
      (l) => l.id !== activeLayoutId && l.isDefault && l.width === newW && l.height === newH
    );
    const updated = layouts.map((l) =>
      l.id === activeLayoutId
        ? { ...l, [field]: num, isDefault: newResAlreadyHasDefault ? false : l.isDefault }
        : l
    );
    setLayouts(updated);
    persistLayouts(updated);
  }

  function handleSetDefault() {
    if (!activeLayout || activeLayout.isDefault) return;
    const updated = layouts.map((l) => ({
      ...l,
      isDefault: l.id === activeLayoutId
        ? true
        : (l.width === activeLayout.width && l.height === activeLayout.height ? false : l.isDefault),
    }));
    setLayouts(updated);
    persistLayouts(updated);
  }

  function handleDeleteLayout() {
    if (!activeLayout) return;
    const updated = layouts.filter((l) => l.id !== activeLayoutId);
    setLayouts(updated);
    persistLayouts(updated);
    setShowDeleteConfirm(false);
  }

  // ---- Export / Import all layouts ----------------------------------------

  function handleExportLayouts() {
    const blob = new Blob(
      [JSON.stringify({ layouts }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stylish-player-layouts.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportLayouts(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset so the same file can be re-imported if needed
    e.target.value = '';
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        const incoming = Array.isArray(parsed.layouts) ? parsed.layouts : null;
        if (!incoming) { showToast('Invalid layout file — missing "layouts" array.', 'error'); return; }
        // Regenerate IDs to avoid collisions, rename duplicates
        const existingNameSet = new Set(layouts.map((l) => l.name));
        // Track which resolutions already have a default in the existing layouts
        const existingDefaultResolutions = new Set(
          layouts.filter((l) => l.isDefault).map((l) => `${l.width}x${l.height}`)
        );
        const merged = [...layouts];
        let added = 0;
        for (const layout of incoming) {
          let name = layout.name || 'Imported Layout';
          // Avoid name collisions
          let candidate = name;
          let suffix = 2;
          while (existingNameSet.has(candidate)) { candidate = `${name} (${suffix++})`; }
          existingNameSet.add(candidate);
          // Strip isDefault if the existing layouts already have a default for this resolution
          const key = `${layout.width}x${layout.height}`;
          const isDefault = layout.isDefault && !existingDefaultResolutions.has(key);
          if (isDefault) existingDefaultResolutions.add(key); // claim it so subsequent imports don't also get it
          merged.push({ ...layout, id: generateId(), name: candidate, isDefault });
          added++;
        }
        setLayouts(merged);
        persistLayouts(merged);
        showToast(`Imported ${added} layout${added !== 1 ? 's' : ''}.`, 'success');
      } catch {
        showToast('Failed to parse the JSON file.', 'error');
      }
    };
    reader.readAsText(file);
  }

  // ---- Canvas / cell handlers (Features 03-08) ----------------------------

  function handleCellClick(cellId, event) {
    const isMulti = !!(event.ctrlKey || event.metaKey);
    event.stopPropagation();
    setSelectedCells((prev) => {
      if (!isMulti) return [cellId];
      if (prev.includes(cellId)) return prev.filter((id) => id !== cellId);
      return [...prev, cellId];
    });
  }

  function handleContextMenu(cellId, event) {
    event.preventDefault();
    event.stopPropagation();
    setSelectedCells([cellId]);
    setContextMenu({ cellId, x: event.clientX, y: event.clientY });
  }

  function applyLayoutUpdate(newLayout) {
    const updated = layouts.map((l) => (l.id === activeLayoutId ? newLayout : l));
    setLayouts(updated);
    persistLayouts(updated);
  }

  // Feature 06: Split
  function handleSplitCellIntoRows(cellId) {
    if (!activeLayout) return;
    const newCells = updateCellById(activeLayout.cells, cellId, {
      itemKey: null,
      subdivisions: {
        rows: 2, cols: 1,
        rowFractions: [1, 1], colFractions: [1],
        cells: [[makeCell()], [makeCell()]],
      },
    });
    applyLayoutUpdate({ ...activeLayout, cells: newCells });
    setSelectedCells([]);
  }

  function handleSplitCellIntoColumns(cellId) {
    if (!activeLayout) return;
    const newCells = updateCellById(activeLayout.cells, cellId, {
      itemKey: null,
      subdivisions: {
        rows: 1, cols: 2,
        rowFractions: [1], colFractions: [1, 1],
        cells: [[makeCell(), makeCell()]],
      },
    });
    applyLayoutUpdate({ ...activeLayout, cells: newCells });
    setSelectedCells([]);
  }

  // Feature 07: Merge
  function handleMergeCells() {
    if (!activeLayout || selectedCells.length < 2) return;
    if (!areCellsAdjacent(selectedCells, activeLayout.cells)) return;

    const parentCells = findCommonParentCells(activeLayout.cells, selectedCells);
    if (!parentCells) return;

    const positions = [];
    parentCells.forEach((row, rIdx) =>
      (row || []).forEach((cell, cIdx) => {
        if (cell && selectedCells.includes(cell.id)) positions.push({ row: rIdx, col: cIdx });
      }),
    );

    if (positions.length !== selectedCells.length) return;

    const sameRow = positions.every((p) => p.row === positions[0].row);
    const sameCol = positions.every((p) => p.col === positions[0].col);
    if (!sameRow && !sameCol) return;

    const isTopLevel = parentCells === activeLayout.cells;
    let newParentCells;
    let dimUpdates = {};

    if (sameRow) {
      const rowIndex = positions[0].row;
      const cols = positions.map((p) => p.col).sort((a, b) => a - b);
      const startCol = cols[0];
      const spanCols = cols.length;
      const merged = { ...makeCell(), colSpan: spanCols };
      // Only splice the merged row — CSS Grid handles colSpan in other rows automatically
      newParentCells = parentCells.map((r, rIdx) => {
        if (rIdx !== rowIndex) return r;
        const nr = [...r];
        nr.splice(startCol, spanCols, merged);
        return nr;
      });
      if (isTopLevel) {
        const existingCf = activeLayout.colFractions ?? Array(activeLayout.cols ?? 1).fill(1);
        const mergedFr = existingCf.slice(startCol, startCol + spanCols).reduce((a, b) => a + b, 0);
        const newCf = [...existingCf.slice(0, startCol), mergedFr, ...existingCf.slice(startCol + spanCols)];
        dimUpdates.colFractions = newCf;
        dimUpdates.cols = newCf.length;
      }
    } else {
      const colIndex = positions[0].col;
      const rows = positions.map((p) => p.row).sort((a, b) => a - b);
      const startRow = rows[0];
      const spanRows = rows.length;
      const merged = { ...makeCell(), rowSpan: spanRows };
      newParentCells = parentCells.map((r, rIdx) => {
        const nr = [...r];
        if (rIdx === startRow) { nr.splice(colIndex, 1, merged); return nr; }
        if (rIdx > startRow && rIdx < startRow + spanRows) { nr.splice(colIndex, 1, null); return nr; }
        return r;
      });
      if (isTopLevel) {
        const existingRf = activeLayout.rowFractions ?? Array(activeLayout.rows ?? 1).fill(1);
        const mergedFr = existingRf.slice(startRow, startRow + spanRows).reduce((a, b) => a + b, 0);
        const newRf = [...existingRf.slice(0, startRow), mergedFr, ...existingRf.slice(startRow + spanRows)];
        dimUpdates.rowFractions = newRf;
        dimUpdates.rows = newRf.length;
      }
    }

    const newTopCells = isTopLevel
      ? newParentCells
      : replaceCellsArrayInTree(activeLayout.cells, parentCells, newParentCells);

    applyLayoutUpdate({ ...activeLayout, cells: newTopCells, ...dimUpdates });
    setSelectedCells([]);
  }

  // Feature 04/05: Clear & Assign
  function handleClearCell(cellId) {
    if (!activeLayout) return;
    applyLayoutUpdate({ ...activeLayout, cells: updateCellById(activeLayout.cells, cellId, { itemKey: null }) });
  }

  function handleSetCellPlayerType(cellId, playerType) {
    if (!activeLayout) return;
    applyLayoutUpdate({ ...activeLayout, cells: updateCellById(activeLayout.cells, cellId, { playerType: playerType || null }) });
  }

  function handleSetCellVizType(cellId, vizType) {
    if (!activeLayout) return;
    applyLayoutUpdate({ ...activeLayout, cells: updateCellById(activeLayout.cells, cellId, { vizType: vizType || null }) });
  }

  function handleAssignItem(itemKey, cellId) {
    if (!activeLayout) return;
    applyLayoutUpdate({ ...activeLayout, cells: updateCellById(activeLayout.cells, cellId, { itemKey }) });
    setContextMenu(null);
  }

  function handleSetCellAlignment(cellId, prop, value) {
    if (!activeLayout) return;
    applyLayoutUpdate({ ...activeLayout, cells: updateCellById(activeLayout.cells, cellId, { [prop]: value }) });
  }

  // Feature 08: Resize (drag handles)
  function handleResizeMouseDown(e, type, index, parentCellId = null) {
    e.preventDefault();
    e.stopPropagation();
    const gridEl = e.currentTarget.closest('.ld-grid');
    if (!gridEl) return;
    const rect = gridEl.getBoundingClientRect();
    const totalSize = type === 'col' ? rect.width : rect.height;
    const fracs = parentCellId
      ? (() => {
        const c = findCellById(activeLayout?.cells ?? [], parentCellId);
        return type === 'col'
          ? (c?.subdivisions?.colFractions ?? [])
          : (c?.subdivisions?.rowFractions ?? []);
      })()
      : type === 'col' ? colFractions : rowFractions;

    dragRef.current = {
      type, index, parentCellId,
      startX: e.clientX, startY: e.clientY,
      startFrA: fracs[index], startFrB: fracs[index + 1],
      totalFr: fracs[index] + fracs[index + 1],
      totalSize,
    };

    function onMove(ev) {
      if (!dragRef.current) return;
      const { type: t, index: i, parentCellId: pid, startX, startY, startFrA, totalFr, totalSize: ts } = dragRef.current;
      const delta = t === 'col' ? ev.clientX - startX : ev.clientY - startY;
      const deltaFr = (delta / ts) * totalFr;
      // Minimum cell size expressed in pixels and converted to fr so the
      // floor stays consistent regardless of how deep the subdivision is.
      // A pure fraction-based floor felt heavier on shallow subdivisions
      // (large container) than deep ones (small container).
      const MIN_PX = 4;
      const min = ts > 0 ? (MIN_PX / ts) * totalFr : 0.01;
      const newFrA = Math.max(min, Math.min(totalFr - min, startFrA + deltaFr));
      const newFrB = totalFr - newFrA;

      setLayouts((prev) => prev.map((l) => {
        if (l.id !== activeLayoutId) return l;
        if (pid) {
          // Subdivision resize
          const key = t === 'col' ? 'colFractions' : 'rowFractions';
          const newCells = updateCellById(l.cells, pid, {
            subdivisions: {
              ...findCellById(l.cells, pid)?.subdivisions,
              [key]: (() => {
                const f = [...(findCellById(l.cells, pid)?.subdivisions?.[key] ?? [])];
                f[i] = newFrA; f[i + 1] = newFrB;
                return f;
              })(),
            },
          });
          return { ...l, cells: newCells };
        }
        if (t === 'col') {
          const cf = [...(l.colFractions ?? Array(l.cols).fill(1))];
          cf[i] = newFrA; cf[i + 1] = newFrB;
          return { ...l, colFractions: cf };
        } else {
          const rf = [...(l.rowFractions ?? Array(l.rows).fill(1))];
          rf[i] = newFrA; rf[i + 1] = newFrB;
          return { ...l, rowFractions: rf };
        }
      }));
    }

    function onUp() {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      // Persist on release
      setLayouts((prev) => { persistLayouts(prev); return prev; });
      dragRef.current = null;
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  // ---- Grid renderer -------------------------------------------------------

  function renderResizeHandles(colFr, rowFr, colIdx, rowIdx, parentCellId) {
    return (
      <>
        {colIdx < colFr.length - 1 && (
          <div
            className="ld-resize-handle ld-resize-handle--col"
            onMouseDown={(e) => handleResizeMouseDown(e, 'col', colIdx, parentCellId)}
          />
        )}
        {rowIdx < rowFr.length - 1 && (
          <div
            className="ld-resize-handle ld-resize-handle--row"
            onMouseDown={(e) => handleResizeMouseDown(e, 'row', rowIdx, parentCellId)}
          />
        )}
      </>
    );
  }

  function getGridColumnIndex(rowArr, colIdx) {
    return (rowArr || []).slice(0, colIdx).reduce(
      (sum, c) => sum + (c ? (c.colSpan || 1) : 1),
      0,
    );
  }

  function renderCells(cells, cFr, rFr, parentCellId = null, parentWidth = activeLayout?.width ?? 0, parentHeight = activeLayout?.height ?? 0) {
    const totalColFr = cFr.reduce((sum, f) => sum + f, 0);
    const totalRowFr = rFr.reduce((sum, f) => sum + f, 0);

    return cells.flatMap((rowArr, rowIdx) =>
      (rowArr || []).map((cell, colIdx) => {
        if (!cell) return null;

        const colSpan = cell.colSpan || 1;
        const rowSpan = cell.rowSpan || 1;
        const isSelected = selectedCells.includes(cell.id);

        // Compute actual grid column start from cumulative colSpans of preceding cells.
        // colIdx alone is wrong after a merge-splice because cells shift to lower indices.
        const colStart = getGridColumnIndex(rowArr, colIdx) + 1;
        const colStartIndex = getGridColumnIndex(rowArr, colIdx);

        const cellColFrac = cFr.slice(colStartIndex, colStartIndex + colSpan).reduce((sum, f) => sum + f, 0);
        const cellRowFrac = rFr.slice(rowIdx, rowIdx + rowSpan).reduce((sum, f) => sum + f, 0);
        const cellWidth = totalColFr > 0 ? (cellColFrac / totalColFr) * parentWidth : 0;
        const cellHeight = totalRowFr > 0 ? (cellRowFrac / totalRowFr) * parentHeight : 0;
        const cellDims = `${Math.round(cellWidth)}×${Math.round(cellHeight)}`;

        const cellStyle = {
          gridColumn: `${colStart} / span ${colSpan}`,
          gridRow: `${rowIdx + 1} / span ${rowSpan}`,
          position: 'relative',
          overflow: 'hidden',
          minWidth: 0,
          minHeight: 0,
        };

        if (cell.subdivisions) {
          const { rows, cols, rowFractions: rF, colFractions: cF, cells: subCells } = cell.subdivisions;
          const subCF = cF ?? Array(cols).fill(1);
          const subRF = rF ?? Array(rows).fill(1);
          return (
            <div key={cell.id} className="ld-cell ld-cell--parent" style={cellStyle}>
              <div
                className="ld-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: subCF.map((f) => `minmax(0, ${f}fr)`).join(' '),
                  gridTemplateRows: subRF.map((f) => `minmax(0, ${f}fr)`).join(' '),
                  width: '100%',
                  height: '100%',
                }}
              >
                {renderCells(subCells, subCF, subRF, cell.id, cellWidth, cellHeight)}
              </div>
              {/* Outer row/col handles on the parent cell itself */}
              {colIdx < cFr.length - 1 && (
                <div
                  className="ld-resize-handle ld-resize-handle--col"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'col', colIdx, parentCellId)}
                />
              )}
              {rowIdx < rFr.length - 1 && (
                <div
                  className="ld-resize-handle ld-resize-handle--row"
                  onMouseDown={(e) => handleResizeMouseDown(e, 'row', rowIdx, parentCellId)}
                />
              )}
            </div>
          );
        }

        return (
          <div
            key={cell.id}
            className={`ld-cell${isSelected ? ' ld-cell--selected' : ''}`}
            style={{
              ...cellStyle,
              display: 'flex',
              alignItems: cell.alignItems || 'center',
              justifyContent: cell.justifyContent || 'center',
            }}
            onClick={(e) => handleCellClick(cell.id, e)}
            onContextMenu={(e) => handleContextMenu(cell.id, e)}
          >
            {cell.itemKey && (
              <>
                {LAYOUT_ITEM_ICONS[cell.itemKey] && (
                  <span className="material-icons ld-cell__icon">{LAYOUT_ITEM_ICONS[cell.itemKey]}</span>
                )}
                <span className="ld-cell__label">{t('item_' + cell.itemKey, LAYOUT_ITEMS[cell.itemKey] ?? cell.itemKey)}</span>
                {cell.itemKey === 'player' && cell.playerType && (
                  <span className="ld-cell__sublabel">{t('player_type_' + cell.playerType, cell.playerType)}</span>
                )}
                {cell.itemKey === 'viz' && cell.vizType && (
                  <span className="ld-cell__sublabel">{t('viz_type_' + cell.vizType, cell.vizType)}</span>
                )}
              </>
            )}
            {showDimensions && <span className="ld-cell__dimensions">{cellDims}</span>}
            {renderResizeHandles(cFr, rFr, colIdx, rowIdx, parentCellId)}
          </div>
        );
      }),
    );
  }

  // ---- Toolbar JSX ----------------------------------------------------------

  function renderToolbar() {
    return (
      <div className="ld-toolbar d-flex align-items-center gap-2 p-2">
        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={!canSplit}
          onClick={() => handleSplitCellIntoRows(selectedCellId)}
          title={t('toolbar_title_split_rows')}
        >
          <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>table_rows</span>
          <span className="ms-1">{t('toolbar_split_rows')}</span>
        </button>

        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={!canSplit}
          onClick={() => handleSplitCellIntoColumns(selectedCellId)}
          title={t('toolbar_title_split_cols')}
        >
          <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>view_column</span>
          <span className="ms-1">{t('toolbar_split_cols')}</span>
        </button>

        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={!canMerge}
          onClick={handleMergeCells}
          title={t('toolbar_title_merge')}
        >
          <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>merge</span>
          <span className="ms-1">{t('toolbar_merge')}</span>
        </button>

        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={!canClear}
          onClick={() => handleClearCell(selectedCellId)}
          title={t('toolbar_title_clear')}
        >
          <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>delete_sweep</span>
          <span className="ms-1">{t('toolbar_clear')}</span>
        </button>

        {canAlign && (
          <>
            <div className="vr" />
            <div className="d-flex flex-row gap-1">
              {/* Vertical alignment */}
              <div className="d-flex flex-row" role="group" aria-label={t('toolbar_aria_valign')}>
                {['flex-start', 'center', 'flex-end'].map((v, i) => (
                  <button
                    key={v}
                    className={`btn btn-sm ${(selectedCellObj?.alignItems ?? 'center') === v ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleSetCellAlignment(selectedCellId, 'alignItems', v)}
                    title={[t('toolbar_align_top'), t('toolbar_align_middle'), t('toolbar_align_bottom')][i]}
                  >
                    <span className="material-icons" style={{ fontSize: '1rem' }}>
                      {['vertical_align_top', 'vertical_align_center', 'vertical_align_bottom'][i]}
                    </span>
                  </button>
                ))}
              </div>
              {/* Horizontal alignment */}
              <div className="d-flex flex-row" role="group" aria-label={t('toolbar_aria_halign')}>
                {['flex-start', 'center', 'flex-end'].map((v, i) => (
                  <button
                    key={v}
                    className={`btn btn-sm ${(selectedCellObj?.justifyContent ?? 'center') === v ? 'btn-primary' : 'btn-outline-secondary'}`}
                    onClick={() => handleSetCellAlignment(selectedCellId, 'justifyContent', v)}
                    title={[t('toolbar_align_left'), t('toolbar_align_center'), t('toolbar_align_right')][i]}
                  >
                    <span className="material-icons" style={{ fontSize: '1rem' }}>
                      {['format_align_left', 'format_align_center', 'format_align_right'][i]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <div className="ms-auto form-check form-switch mb-0 d-flex align-items-center flex-shrink-0" style={{ paddingLeft: 0, gap: '0.5rem' }}>
          <input
            className="form-check-input m-0"
            type="checkbox"
            role="switch"
            id="ld-toggle-dimensions"
            checked={showDimensions}
            onChange={(e) => setShowDimensions(e.target.checked)}
            style={{ marginLeft: 0, flexShrink: 0 }}
          />
          <label
            className="form-check-label mb-0"
            htmlFor="ld-toggle-dimensions"
            title={t('toolbar_title_show_dimensions')}
            style={{ whiteSpace: 'nowrap' }}
          >
            {t('toolbar_show_dimensions')}
          </label>
        </div>

      </div>
    );
  }

  // ---- Context menu items (derived from current cell state) ---------------

  const contextMenuItems = (() => {
    if (!contextMenu) return [];
    const items = [];

    // Add Item (submenu) or "all assigned" placeholder
    if (!contextCellObj?.itemKey) {
      items.push({
        label: t('ctx_add_item'),
        icon: 'add_box',
        submenu: availableItems.length > 0
          ? availableItems.map(([key]) => {
            if (key === 'buttonRow') {
              const otherButtonItems = OTHER_BUTTON_ITEM_KEYS
                .filter((subKey) => !assignedItemKeys.has(subKey))
                .map((subKey) => ({
                  label: t('item_' + subKey, LAYOUT_ITEMS[subKey]),
                  icon: LAYOUT_ITEM_ICONS[subKey] ?? null,
                  onClick: () => { handleAssignItem(subKey, contextMenu.cellId); setContextMenu(null); },
                }));

              if (!assignedItemKeys.has('buttonRow')) {
                if (otherButtonItems.length) otherButtonItems.push({ separator: true });
                otherButtonItems.push({
                  label: t('item_buttonRowAll', 'All'),
                  icon: LAYOUT_ITEM_ICONS.buttonRow ?? null,
                  onClick: () => { handleAssignItem('buttonRow', contextMenu.cellId); setContextMenu(null); },
                });
              }

              return {
                label: t('item_' + key, LAYOUT_ITEMS[key]),
                icon: LAYOUT_ITEM_ICONS[key] ?? null,
                submenu: otherButtonItems.length ? otherButtonItems : undefined,
                empty: otherButtonItems.length === 0 ? t('ctx_all_assigned') : undefined,
              };
            }

            return {
              label: t('item_' + key, LAYOUT_ITEMS[key]),
              icon: LAYOUT_ITEM_ICONS[key] ?? null,
              onClick: () => { handleAssignItem(key, contextMenu.cellId); setContextMenu(null); },
            };
          })
          : undefined,
        empty: availableItems.length === 0 ? t('ctx_all_assigned') : undefined,
      });
    } else {
      items.push({
        label: t('ctx_remove_item'),
        icon: 'remove_circle_outline',
        onClick: () => { handleClearCell(contextMenu.cellId); setContextMenu(null); },
      });

      if (contextCellObj.itemKey === 'player') {
        items.push({
          label: t('ctx_player_type', 'Player Type'),
          icon: 'radio',
          submenu: PLAYER_TYPE_OPTIONS.map(({ value, label }) => ({
            label: t('player_type_' + value, label),
            icon: contextCellObj.playerType === value ? 'check' : null,
            onClick: () => handleSetCellPlayerType(contextMenu.cellId, contextCellObj.playerType === value ? null : value),
          })),
        });
        if (contextCellObj.playerType) {
          items.push({
            label: t('ctx_use_global_setting', 'Use Global Setting'),
            icon: 'settings_backup_restore',
            onClick: () => handleSetCellPlayerType(contextMenu.cellId, null),
          });
        }
      }

      if (contextCellObj.itemKey === 'viz') {
        items.push({
          label: t('ctx_viz_type', 'Visualization Type'),
          icon: 'equalizer',
          submenu: VIZ_TYPE_OPTIONS.map(({ value, label }) => ({
            label: t('viz_type_' + value, label),
            icon: contextCellObj.vizType === value ? 'check' : null,
            onClick: () => handleSetCellVizType(contextMenu.cellId, contextCellObj.vizType === value ? null : value),
          })),
        });
        if (contextCellObj.vizType) {
          items.push({
            label: t('ctx_use_global_setting', 'Use Global Setting'),
            icon: 'settings_backup_restore',
            onClick: () => handleSetCellVizType(contextMenu.cellId, null),
          });
        }
      }
    }

    items.push({ separator: true });

    if (canSplitContextCell) {
      items.push(
        { label: t('ctx_split_rows'), icon: 'table_rows', onClick: () => { handleSplitCellIntoRows(contextMenu.cellId); setContextMenu(null); } },
        { label: t('ctx_split_cols'), icon: 'view_column', onClick: () => { handleSplitCellIntoColumns(contextMenu.cellId); setContextMenu(null); } },
      );
    }

    if (canMerge) {
      if (canSplitContextCell) items.push({ separator: true });
      items.push({ label: t('ctx_merge'), icon: 'merge', onClick: () => { handleMergeCells(); setContextMenu(null); } });
    }

    return items;
  })();

  // ---- Context menu JSX — now delegated to ContextMenu component ----------

  function renderContextMenu() {
    return (
      <ContextMenu
        variant="positioned"
        isOpen={!!contextMenu}
        onClose={() => setContextMenu(null)}
        position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null}
        items={contextMenuItems}
      />
    );
  }

  // ---- Canvas Dialog JSX ---------------------------------------------------

  function renderCanvasDialog() {
    if (!activeLayout) return null;
    const ratio = activeLayout.width / activeLayout.height;

    return (
      <Dialog
        open={showCanvasDialog}
        onClose={() => { setShowCanvasDialog(false); setSelectedCells([]); }}
        title={t('canvas_title', { name: activeLayout.name, width: activeLayout.width, height: activeLayout.height })}
        size="full"
        className="ld-canvas-dialog"
        toolbar={renderToolbar()}
        closeOnBackdrop={false}
        showCloseButton
      >
        <div className="ld-canvas-wrap">
          <div
            className="ld-canvas"
            style={{ '--ld-ratio': ratio }}
          >
            <div
              className="ld-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: colFractions.map((f) => `minmax(0, ${f}fr)`).join(' '),
                gridTemplateRows: rowFractions.map((f) => `minmax(0, ${f}fr)`).join(' '),
                width: '100%',
                height: '100%',
              }}
              onClick={() => setSelectedCells([])}
            >
              {renderCells(activeLayout.cells, colFractions, rowFractions, null, activeLayout.width, activeLayout.height)}
            </div>
          </div>
        </div>

        {renderContextMenu()}
      </Dialog>
    );
  }

  // ---- Main page render ----------------------------------------------------

  return (
    <div className="layout-designer container-fluid p-4">
      <Toast toasts={toasts} />
      <AppMenu />

      {/* Hidden file input for JSON import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json,application/json"
        style={{ display: 'none' }}
        onChange={handleImportLayouts}
      />

      <div className="d-flex align-items-center mb-4 gap-3">
        <h4 className="mb-0 ms-4">{t('page_title')}</h4>
        <small className="text-secondary">{t('screen_resolution', { w: screen.w, h: screen.h })}</small>
        <button
          className="btn btn-sm btn-primary ms-auto"
          onClick={() => setShowCreateForm(true)}
        >
          <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>add</span>
          <span className="ms-1">{t('btn_new_layout')}</span>
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          disabled={!layouts.length}
          onClick={handleExportLayouts}
          title="Export all layouts as JSON"
        >
          <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>file_download</span>
          <span className="ms-1">Export</span>
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => importInputRef.current?.click()}
          title="Import layouts from JSON"
        >
          <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>file_upload</span>
          <span className="ms-1">Import</span>
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={() => navigate('/')}
          title={t('btn_back_to_home')}
        >
          <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>close</span>
        </button>
      </div>

      {/* Create Layout Form */}
      {showCreateForm && (
        <div className="card mb-4">
          <div className="card-body p-5">
            <h6 className="card-title mb-3">{t('section_create')}</h6>
            <CreateLayoutForm
              onSubmit={handleCreateLayout}
              onCancel={() => setShowCreateForm(false)}
              existingNames={existingNames}
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!layouts.length && !showCreateForm && (
        <div className="text-center text-secondary py-5">
          <span className="material-icons d-block mb-2" style={{ fontSize: '3rem' }}>dashboard_customize</span>
          <p className="mb-0">
            <Trans i18nKey="empty_state" t={t} components={{ bold: <strong /> }} />
          </p>
        </div>
      )}

      {/* Layout Selector */}
      {layouts.length > 0 && (
        <div className="card mb-4">
          <div className="card-body p-5">
            {/* Dropdown + action buttons */}
            <div className="d-flex align-items-center gap-2 mb-3 flex-wrap">
              <select
                className="form-select form-select-sm"
                style={{ maxWidth: 320 }}
                value={activeLayoutId ?? ''}
                onChange={(e) => setActiveLayoutId(e.target.value)}
              >
                {layouts.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} — {l.width}×{l.height}{l.isDefault ? ' ★' : ''}
                  </option>
                ))}
              </select>

              <button
                className="btn btn-sm btn-outline-primary"
                disabled={!activeLayout}
                onClick={() => setShowCanvasDialog(true)}
                title={t('btn_edit_layout')}
              >
                <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>grid_on</span>
                <span className="ms-1">{t('btn_edit_layout')}</span>
              </button>

              <button
                className={`btn btn-sm ${activeLayout?.isDefault ? 'btn-warning' : 'btn-outline-secondary'}`}
                disabled={!activeLayout || activeLayout?.isDefault}
                onClick={handleSetDefault}
                title={activeLayout?.isDefault ? t('title_remove_default') : t('title_set_default')}
              >
                <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>star</span>
                <span className="ms-1">{activeLayout?.isDefault ? t('btn_default') : t('btn_set_default')}</span>
              </button>

              <button
                className="btn btn-sm btn-outline-danger"
                disabled={!activeLayout}
                onClick={() => setShowDeleteConfirm(true)}
                title={t('title_delete_layout')}
              >
                <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle' }}>delete</span>
                {t('btn_delete')}
              </button>
            </div>

            {/* Inline metadata editor */}
            {activeLayout && (
              <div className="d-flex gap-2 flex-wrap align-items-end">
                <div>
                  <label className="form-label form-label-sm mb-1">{t('label_name')}</label>
                  <input
                    className="form-control form-control-sm"
                    style={{ maxWidth: 220 }}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleUpdateLayoutName}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                  />
                </div>
                <div>
                  <label className="form-label form-label-sm mb-1">{t('label_width_px')}</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ maxWidth: 100 }}
                    value={editWidth}
                    onChange={(e) => setEditWidth(e.target.value)}
                    onBlur={() => handleUpdateLayoutDimension('width')}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                    min={1}
                  />
                </div>
                <div>
                  <label className="form-label form-label-sm mb-1">{t('label_height_px')}</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    style={{ maxWidth: 100 }}
                    value={editHeight}
                    onChange={(e) => setEditHeight(e.target.value)}
                    onBlur={() => handleUpdateLayoutDimension('height')}
                    onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
                    min={1}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      <Dialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={t('delete_dialog_title')}
        size="sm"
        footer={
          <div className="d-flex gap-2 justify-content-end">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowDeleteConfirm(false)}>{t('btn_cancel')}</button>
            <button className="btn btn-sm btn-danger" onClick={handleDeleteLayout}>{t('btn_delete')}</button>
          </div>
        }
      >
        <p className="mb-0">
          <Trans i18nKey="delete_confirm" t={t} values={{ name: activeLayout?.name }} components={{ bold: <strong /> }} />
        </p>
      </Dialog>

      {/* Canvas Dialog */}
      {renderCanvasDialog()}
    </div>
  );
}
