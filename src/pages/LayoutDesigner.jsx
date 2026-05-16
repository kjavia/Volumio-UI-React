import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import usePluginConfig from '@/hooks/usePluginConfig';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';
import ContextMenu from '@/components/ContextMenu';
import Dialog from '@/components/Dialog';
import './layout-designer.scss';

const PLUGIN_ENDPOINT = 'user_interface/stylish_player';
const LAYOUT_ITEMS = [
  { key: 'trackName', label: 'Track Name', icon: 'music_note' },
  { key: 'albumName', label: 'Album Name', icon: 'album' },
  { key: 'artistName', label: 'Artist Name', icon: 'person' },
  { key: 'serviceLogo', label: 'Service Logo', icon: 'image' },
  { key: 'samplingRate', label: 'Sampling Rate', icon: 'equalizer' },
  { key: 'playerControls', label: 'Player Controls', icon: 'play_arrow' },
  { key: 'player', label: 'Player Graphic', icon: 'play_circle' },
  { key: 'viz', label: 'Visualization', icon: 'graphic_eq' },
  { key: 'buttonRow', label: 'Button Row', icon: 'apps' },
  { key: 'volumeSlider', label: 'Volume Slider', icon: 'volume_up' },
];

const getCellKeyDisplay = (itemKey) => {
  const item = LAYOUT_ITEMS.find(item => item.key === itemKey);
  return item ? item.label : itemKey;
};

const parseLayoutDesigner = (value) => {
  if (!value) {
    return { layouts: [] };
  }
  if (typeof value === 'object') {
    return value;
  }
  try {
    return JSON.parse(value);
  } catch {
    return { layouts: [] };
  }
};

const makeEmptyCells = (rows, cols) => Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ id: `cell-${Date.now()}-${Math.random()}`, itemKey: null, subdivisions: null })));

const updateCellById = (cells, cellId, updates) => {
  if (!cells) return cells;
  return cells.map((row) => {
    if (!row) return row;
    return row.map((cell) => {
      if (!cell) return cell;
      if (cell.id === cellId) return { ...cell, ...updates };
      if (cell.subdivisions) {
        return {
          ...cell,
          subdivisions: { ...cell.subdivisions, cells: updateCellById(cell.subdivisions.cells, cellId, updates) },
        };
      }
      return cell;
    });
  });
};

const getNextLayoutName = (existingLayouts) => {
  let index = 1;
  while (existingLayouts.some((layout) => layout.name?.toLowerCase() === `layout${index}`.toLowerCase())) {
    index += 1;
  }
  return `Layout${index}`;
};

const isDuplicateLayoutName = (name, layouts, excludeId = null) => {
  if (!name) return false;
  return layouts.some(
    (layout) => layout.id !== excludeId && layout.name?.toLowerCase() === name.trim().toLowerCase()
  );
};

const getItemKeysFromCells = (cells) => {
  const keys = [];
  if (!cells) return keys;
  for (let row of cells) {
    if (!row) continue;
    for (let cell of row) {
      if (!cell) continue;
      if (cell.itemKey) keys.push(cell.itemKey);
      if (cell.subdivisions) keys.push(...getItemKeysFromCells(cell.subdivisions.cells));
    }
  }
  return keys;
};

const findCellCoordinates = (cells, cellId) => {
  for (let rowIndex = 0; rowIndex < cells.length; rowIndex++) {
    const row = cells[rowIndex];
    if (!row) continue;
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cell = row[colIndex];
      if (!cell) continue;
      if (cell.id === cellId) return { row: rowIndex, col: colIndex };
      // Check subdivisions
      if (cell.subdivisions) {
        const found = findCellCoordinates(cell.subdivisions.cells, cellId);
        if (found) return null; // Don't split subdivided cells
      }
    }
  }
  return null;
};

const LayoutDesigner = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { data: pluginConfig, isLoading } = usePluginConfig();
  const { toasts, showToast } = useToast();
  const [layouts, setLayouts] = useState([]);
  const [activeLayoutId, setActiveLayoutId] = useState(null);
  const [isCreatingLayout, setIsCreatingLayout] = useState(false);
  const [widthInput, setWidthInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [nameInput, setNameInput] = useState('Layout1');
  const [saving, setSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [screenSize] = useState(() => ({ width: typeof window !== 'undefined' ? window.innerWidth : 0, height: typeof window !== 'undefined' ? window.innerHeight : 0 }));
  const [selectedCells, setSelectedCells] = useState([]);
  const closeContextMenu = () => {
    setContextMenu(null);
    setSelectedCells([]);
  };

  const handleCellClick = useCallback((cellId, event) => {
    if (event.ctrlKey || event.metaKey) {
      // Toggle selection
      setSelectedCells(prev =>
        prev.includes(cellId)
          ? prev.filter(id => id !== cellId)
          : [...prev, cellId]
      );
    } else {
      // Single selection
      setSelectedCells([cellId]);
    }
  }, []);

  const clearSelection = useCallback(() => setSelectedCells([]), []);

  const activeLayout = useMemo(
    () => layouts.find((layout) => layout.id === activeLayoutId) || layouts[0] || null,
    [layouts, activeLayoutId]
  );

  const cellMap = useMemo(() => {
    const map = {};
    if (!activeLayout) return map;
    activeLayout.cells.forEach((row, r) => {
      if (!row) return;
      row.forEach((cell, c) => {
        if (!cell) return;
        map[cell.id] = { cell, row: r, col: c };
      });
    });
    return map;
  }, [activeLayout]);



  const layoutBaseWidth = useMemo(() => {
    if (!activeLayout) return 0;
    return Number.isFinite(activeLayout.width) ? activeLayout.width : 0;
  }, [activeLayout]);

  const layoutBaseHeight = useMemo(() => {
    if (!activeLayout) return 0;
    return Number.isFinite(activeLayout.height) ? activeLayout.height : 0;
  }, [activeLayout]);

  const layoutScale = useMemo(() => {
    if (!activeLayout || !layoutBaseWidth || !layoutBaseHeight) return 1;
    const availableWidth = Math.max(0, screenSize.width - 96);
    const availableHeight = Math.max(0, screenSize.height - 320);
    return Math.min(1, availableWidth / layoutBaseWidth, availableHeight / layoutBaseHeight);
  }, [activeLayout, layoutBaseWidth, layoutBaseHeight, screenSize]);

  const createEmptyCell = () => ({
    id: `cell-${Date.now()}-${Math.random()}`,
    itemKey: null,
    subdivisions: null,
  });

  const persistLayouts = useCallback((layoutsToPersist) => {
    if (!socket) {
      showToast('Unable to save layout. Connection not available.', 'error');
      return;
    }

    socket.emit('callMethod', {
      endpoint: PLUGIN_ENDPOINT,
      method: 'configSaveLayoutDesigner',
      data: { layoutDesigner: JSON.stringify({ layouts: layoutsToPersist }) },
    });
  }, [socket, showToast]);

  const handleAddSection = useCallback(() => {
    if (!activeLayout) return;

    const cells = activeLayout.cells.map((row) => row.slice());
    let added = false;

    for (let rowIndex = 0; rowIndex < cells.length && !added; rowIndex += 1) {
      for (let colIndex = 0; colIndex < cells[rowIndex].length; colIndex += 1) {
        if (cells[rowIndex][colIndex] === null) {
          cells[rowIndex][colIndex] = createEmptyCell();
          added = true;
          break;
        }
      }
    }

    if (!added) {
      const cols = Math.max(1, activeLayout.cols || (cells[0]?.length || 1));
      const newRow = Array.from({ length: cols }, () => null);
      newRow[0] = createEmptyCell();
      cells.push(newRow);
    }

    const updatedLayout = {
      ...activeLayout,
      rows: cells.length,
      cols: Math.max(activeLayout.cols || 1, cells[0]?.length || 1),
      cells,
    };

    setLayouts((prev) => {
      const updated = prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout));
      persistLayouts(updated);
      return updated;
    });
  }, [activeLayout, persistLayouts]);




  useEffect(() => {
    if (!pluginConfig) return;
    const designer = parseLayoutDesigner(pluginConfig.layoutDesigner);
    const newLayouts = Array.isArray(designer.layouts) ? designer.layouts : [];
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLayouts(newLayouts);
    if (!activeLayoutId && newLayouts.length) {
      setActiveLayoutId(newLayouts[0].id);
    }
  }, [pluginConfig, activeLayoutId]);

  useEffect(() => {
    if (!layouts.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActiveLayoutId(null);
    } else if (activeLayoutId && !layouts.some((layout) => layout.id === activeLayoutId)) {

      setActiveLayoutId(layouts[0]?.id || null);
    }
  }, [activeLayoutId, layouts]);

  // Calculate extra bottom padding so frame doesn't touch viewport edge
  // No dynamic resize logic — screen size initialized once on mount

  const areCellsNeighboring = useCallback((cellIds) => {
    if (cellIds.length < 2) return false;

    // Find positions of all selected cells
    const positions = [];
    activeLayout.cells.forEach((rowCells, rowIndex) => {
      if (!rowCells) return;
      rowCells.forEach((cell, colIndex) => {
        if (cell && cellIds.includes(cell.id)) {
          positions.push({ row: rowIndex, col: colIndex, id: cell.id });
        }
      });
    });

    if (positions.length !== cellIds.length) return false;

    // Check if all in same row and consecutive columns
    const sameRow = positions.every(pos => pos.row === positions[0].row);
    if (sameRow) {
      const cols = positions.map(p => p.col).sort((a, b) => a - b);
      return cols.every((col, i) => i === 0 || col === cols[i - 1] + 1);
    }

    // Check if all in same column and consecutive rows
    const sameCol = positions.every(pos => pos.col === positions[0].col);
    if (sameCol) {
      const rows = positions.map(p => p.row).sort((a, b) => a - b);
      return rows.every((row, i) => i === 0 || row === rows[i - 1] + 1);
    }

    return false;
  }, [activeLayout]);

  const activeItemKeys = useMemo(() => {
    if (!activeLayout) return [];
    return getItemKeysFromCells(activeLayout.cells);
  }, [activeLayout]);

  const availableItems = useMemo(
    () => LAYOUT_ITEMS.filter((item) => !activeItemKeys.includes(item.key)),
    [activeItemKeys]
  );

  const handleChangeLayout = (id) => {
    setActiveLayoutId(id);
    setContextMenu(null);
  };

  const updateLayout = useCallback((updatedLayout) => {
    setLayouts((prev) => prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout)));
  }, []);

  const handleAddLayout = () => {
    const name = nameInput.trim();
    const width = parseInt(widthInput, 10);
    const height = parseInt(heightInput, 10);

    if (!name || !widthInput.trim() || !heightInput.trim()) {
      showToast('Please fill in layout name, width, and height.', 'error');
      return;
    }

    if (isDuplicateLayoutName(name, layouts)) {
      showToast('Duplicate layout names are not allowed.', 'error');
      return;
    }

    if (Number.isNaN(width) || width <= 0 || Number.isNaN(height) || height <= 0) {
      showToast('Enter valid width and height in pixels.', 'error');
      return;
    }

    const newLayout = {
      id: `layout-${Date.now()}`,
      name,
      width,
      height,
      rows: 1,
      cols: 1,
      cells: makeEmptyCells(1, 1),
    };

    const updatedLayouts = [...layouts, newLayout];
    setLayouts(updatedLayouts);
    setActiveLayoutId(newLayout.id);
    setIsCreatingLayout(false);
    setNameInput(getNextLayoutName(updatedLayouts));
    setWidthInput('');
    setHeightInput('');

    if (!socket) {
      showToast('Unable to save layout. Connection not available.', 'error');
      return;
    }

    setSaving(true);
    socket.emit('callMethod', {
      endpoint: PLUGIN_ENDPOINT,
      method: 'configSaveLayoutDesigner',
      data: { layoutDesigner: JSON.stringify({ layouts: updatedLayouts }) },
    });

    const handleToast = (payload) => {
      socket.off('pushStylishPlayerConfig', handleConfigPush);
      const msg = payload?.message || payload?.title || 'Saved.';
      const type = payload?.type === 'error' ? 'error' : 'success';
      showToast(msg, type);
      setSaving(false);
    };

    const handleConfigPush = () => {
      socket.off('pushToastMessage', handleToast);
      showToast('Layout Designer saved.', 'success');
      setSaving(false);
    };

    socket.once('pushToastMessage', handleToast);
    socket.once('pushStylishPlayerConfig', handleConfigPush);

    setTimeout(() => {
      socket.off('pushToastMessage', handleToast);
      socket.off('pushStylishPlayerConfig', handleConfigPush);
      setSaving(false);
    }, 5000);
  };

  const handleMergeCells = useCallback(() => {
    if (!activeLayout || selectedCells.length < 2 || !areCellsNeighboring(selectedCells)) return;

    // Find positions
    const positions = [];
    activeLayout.cells.forEach((rowCells, rowIndex) => {
      if (!rowCells) return;
      rowCells.forEach((cell, colIndex) => {
        if (cell && selectedCells.includes(cell.id)) {
          positions.push({ row: rowIndex, col: colIndex, cell });
        }
      });
    });

    // Check if any cell has subdivisions or items - don't merge those for now
    if (positions.some(p => p.cell.subdivisions || p.cell.itemKey)) {
      // For now, just clear selection if cells have content
      setSelectedCells([]);
      return;
    }

    const sameRow = positions.every(pos => pos.row === positions[0].row);
    const sameCol = positions.every(pos => pos.col === positions[0].col);

    if (sameRow) {
      // Merge horizontally in same row
      const rowIndex = positions[0].row;
      const cols = positions.map(p => p.col).sort((a, b) => a - b);
      const startCol = cols[0];
      const endCol = cols[cols.length - 1];

      const newCells = [...activeLayout.cells[rowIndex]];
      // Create merged cell
      const mergedCell = {
        id: `merged-${Date.now()}-${Math.random()}`,
        itemKey: null,
        subdivisions: null,
      };

      // Replace the range with merged cell
      newCells.splice(startCol, endCol - startCol + 1, mergedCell);

      const newLayout = {
        ...activeLayout,
        cells: activeLayout.cells.map((row, i) => i === rowIndex ? newCells : row),
      };

      setLayouts(prev => prev.map(l => l.id === activeLayoutId ? newLayout : l));
      persistLayouts([newLayout]);
      setSelectedCells([]);
    } else if (sameCol) {
      // For vertical merge, we need to remove cells from multiple rows and create a taller cell
      // This is more complex and would require restructuring the grid
      // For now, just clear selection
      setSelectedCells([]);
    }
  }, [activeLayout, selectedCells, areCellsNeighboring, activeLayoutId, persistLayouts]);

  const handleDeleteLayout = () => {
    if (!activeLayout) return;
    const confirmed = window.confirm(`Delete layout "${activeLayout.name}"?`);
    if (!confirmed) return;
    const updatedLayouts = layouts.filter((layout) => layout.id !== activeLayout.id);
    setLayouts(updatedLayouts);
    setContextMenu(null);
    persistLayouts(updatedLayouts);
  };

  const handleStartCreatingLayout = () => {
    setIsCreatingLayout(true);
    setNameInput(getNextLayoutName(layouts));
    setWidthInput('');
    setHeightInput('');
  };

  const handleCancelCreatingLayout = () => {
    setIsCreatingLayout(false);
    setNameInput(getNextLayoutName(layouts));
    setWidthInput('');
    setHeightInput('');
  };

  const handleInsertRow = useCallback((rowIndex, direction) => {
    if (!activeLayout) return;
    const sourceRow = activeLayout.cells[rowIndex];
    const numCells = sourceRow ? sourceRow.length : 1;
    const newRow = Array.from({ length: numCells }, () => ({
      id: `cell-${Date.now()}-${Math.random()}`,
      itemKey: null,
      subdivisions: null,
    }));
    const cells = [...activeLayout.cells];
    const insertAt = direction === 'above' ? rowIndex : rowIndex + 1;
    cells.splice(insertAt, 0, newRow);
    const updatedLayout = { ...activeLayout, rows: activeLayout.rows + 1, cells };
    setLayouts((prev) => {
      const updated = prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout));
      persistLayouts(updated);
      return updated;
    });
    setContextMenu(null);
  }, [activeLayout, persistLayouts]);

  const handleInsertColumn = useCallback((colIndex, direction) => {
    if (!activeLayout) return;
    const cells = activeLayout.cells.map((row) => {
      const newRow = [...row];
      const insertAt = direction === 'left' ? colIndex : colIndex + 1;
      newRow.splice(insertAt, 0, null);
      return newRow;
    });
    const updatedLayout = { ...activeLayout, cols: activeLayout.cols + 1, cells };
    setLayouts((prev) => {
      const updated = prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout));
      persistLayouts(updated);
      return updated;
    });
    setContextMenu(null);
  }, [activeLayout, persistLayouts]);

  const handleRemoveCell = useCallback((row, col) => {
    if (!activeLayout) return;
    const cells = activeLayout.cells.map((rowCells, rowIndex) =>
      rowCells.map((cell, colIndex) => (rowIndex === row && colIndex === col ? null : cell))
    );
    const updatedLayout = { ...activeLayout, cells };
    setLayouts((prev) => {
      const updated = prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout));
      persistLayouts(updated);
      return updated;
    });
    setContextMenu(null);
  }, [activeLayout, persistLayouts]);

  const handleUpdateLayoutName = (name) => {
    if (!activeLayout) return;
    if (isDuplicateLayoutName(name, layouts, activeLayout.id)) {
      showToast('Duplicate layout names are not allowed.', 'error');
      return;
    }
    const updatedLayout = { ...activeLayout, name };
    updateLayout(updatedLayout);
    setLayouts((prev) => {
      const updated = prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout));
      persistLayouts(updated);
      return updated;
    });
  };

  const handleAssignItem = useCallback((itemKey, cellId) => {
    if (!activeLayout) return;
    const cells = updateCellById(activeLayout.cells, cellId, { itemKey });
    const updatedLayout = { ...activeLayout, cells };
    setLayouts((prev) => {
      const updated = prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout));
      persistLayouts(updated);
      return updated;
    });
    setContextMenu(null);
  }, [activeLayout, persistLayouts]);

  const handleClearCell = useCallback((cellId) => {
    if (!activeLayout) return;
    const cells = updateCellById(activeLayout.cells, cellId, { itemKey: null });
    const updatedLayout = { ...activeLayout, cells };
    setLayouts((prev) => {
      const updated = prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout));
      persistLayouts(updated);
      return updated;
    });
    setContextMenu(null);
  }, [activeLayout, persistLayouts]);

  const handleSplitCellIntoRows = useCallback((cellId) => {
    if (!activeLayout) return;
    const coords = findCellCoordinates(activeLayout.cells, cellId);
    if (!coords) return;
    const { row, col } = coords;

    // Get the target cell
    const targetCell = (activeLayout.cells?.[row] || [])[col];
    if (!targetCell) return;
    if (targetCell.subdivisions) return; // don't split already subdivided cells

    // Create two new subcells that occupy the same width as the original
    const subA = { id: `cell-${Date.now()}-${Math.random()}`, itemKey: null, subdivisions: null };
    const subB = { id: `cell-${Date.now()}-${Math.random()}`, itemKey: null, subdivisions: null };

    const subdiv = {
      rows: 2,
      cols: 1,
      // cells is a 2D array: rows x cols
      cells: [[subA], [subB]],
    };

    const cells = activeLayout.cells.map((r, rIdx) => {
      if (rIdx !== row) return r;
      return r.map((c, cIdx) => (cIdx === col ? { ...targetCell, subdivisions: subdiv } : c));
    });

    const updatedLayout = { ...activeLayout, cells };
    setLayouts((prev) => {
      const updated = prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout));
      persistLayouts(updated);
      return updated;
    });
    setContextMenu(null);
  }, [activeLayout, persistLayouts]);

  const handleSplitCellIntoColumns = useCallback((cellId) => {
    if (!activeLayout) return;
    const coords = findCellCoordinates(activeLayout.cells, cellId);
    if (!coords) return;
    const { row, col } = coords;

    const targetCell = (activeLayout.cells?.[row] || [])[col];
    if (!targetCell) return;
    if (targetCell.subdivisions) return; // don't split already subdivided cells

    // Create two new subcells that occupy half the width each
    const subA = { id: `cell-${Date.now()}-${Math.random()}`, itemKey: null, subdivisions: null };
    const subB = { id: `cell-${Date.now()}-${Math.random()}`, itemKey: null, subdivisions: null };

    const subdiv = {
      rows: 1,
      cols: 2,
      cells: [[subA, subB]],
    };

    const cells = activeLayout.cells.map((r, rIdx) => {
      if (rIdx !== row) return r;
      return r.map((c, cIdx) => (cIdx === col ? { ...targetCell, subdivisions: subdiv } : c));
    });

    const updatedLayout = { ...activeLayout, cells };
    setLayouts((prev) => {
      const updated = prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout));
      persistLayouts(updated);
      return updated;
    });
    setContextMenu(null);
  }, [activeLayout, persistLayouts]);

  const contextMenuItems = useMemo(() => {
    if (!contextMenu || !activeLayout) return [];
    const { cellId, cell } = contextMenu;
    const totalCells = activeLayout.cells.reduce((sum, row) => sum + (row ? row.filter(c => c !== null).length : 0), 0);
    const canRemoveCell = totalCells > 1;
    const canMerge = selectedCells.length > 1 && areCellsNeighboring(selectedCells);

    const items = [];

    if (canMerge) {
      items.push({ label: 'Merge cells', icon: 'merge', onClick: handleMergeCells });
      items.push({ separator: true });
    }

    items.push(
      ...(cell?.itemKey
        ? [{ label: 'Remove item', icon: 'clear', onClick: () => handleClearCell(cellId) }]
        : [{
          label: 'Add item',
          icon: 'add',
          submenu: availableItems.map((item) => ({ label: item.label, icon: item.icon, onClick: () => handleAssignItem(item.key, cellId) })),
          empty: 'All items have been assigned.',
        }]
      ),
      ...(canRemoveCell ? [{ label: 'Remove cell', icon: 'delete', onClick: () => handleRemoveCell(contextMenu.row, contextMenu.col) }] : [])
    );

    return items;
  }, [contextMenu, activeLayout, availableItems, selectedCells, areCellsNeighboring, handleInsertRow, handleInsertColumn, handleClearCell, handleAssignItem, handleRemoveCell, handleSplitCellIntoRows, handleSplitCellIntoColumns, handleMergeCells]);

  const hasLayout = !!activeLayout;
  const matchedLayout = useMemo(() => {
    if (!layouts.length) return null;
    return layouts.find((layout) =>
      (layout.width === screenSize.width && layout.height === screenSize.height) ||
      (layout.width === screenSize.height && layout.height === screenSize.width)
    );
  }, [layouts, screenSize]);

  if (isLoading) {
    return (
      <div className="layout-designer-page d-flex align-items-center justify-content-center">
        <span className="material-icons spin">sync</span>
      </div>
    );
  }

  return (
    <div className="layout-designer-page container-fluid py-4">
      <div className="layout-designer-topbar d-flex align-items-center justify-content-between mb-4">
        <div>
          <h2 className="layout-designer-title">Layout Designer</h2>
          <p className="layout-designer-subtitle">Create screen resolutions, split the layout into rows and columns, and assign a single item to each cell.</p>
        </div>
        <div className="layout-designer-actions d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary" onClick={() => navigate(-1)}>
            <span className="material-icons">arrow_back</span> Back
          </button>
        </div>
      </div>

      <div className="row gx-4 mb-4">
        <div className="col-12">
          <div className="card layout-designer-panel">
            <div className="card-body">
              <div className="row g-3 align-items-end">
                {!isCreatingLayout && layouts.length > 0 && (
                  <>
                    <div className="col-md-5">
                      <label className="form-label">Select layout</label>
                      <select
                        className="form-select"
                        value={activeLayoutId || ''}
                        onChange={(e) => handleChangeLayout(e.target.value)}
                      >
                        {layouts.map((layout) => (
                          <option key={layout.id} value={layout.id}>
                            {layout.name || `${layout.width}×${layout.height}`} — {layout.width}×{layout.height} ({layout.rows}×{layout.cols})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-auto">
                      <button type="button" className="btn btn-primary" onClick={handleStartCreatingLayout}>
                        Add new layout
                      </button>
                    </div>
                    <div className="col-auto">
                      <button type="button" className="btn btn-outline-danger" onClick={handleDeleteLayout} disabled={!activeLayout}>
                        Delete layout
                      </button>
                    </div>
                    <div className="col-md-3">
                      {activeLayout && (
                        <div>
                          <label className="form-label">Layout name</label>
                          <input
                            type="text"
                            className="form-control"
                            value={activeLayout.name || ''}
                            onChange={(e) => handleUpdateLayoutName(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                    <div className="col-12">
                      <div><strong>Current screen:</strong> {screenSize.width}×{screenSize.height}</div>
                      <div className="mt-2">
                        {matchedLayout ? (
                          <span className="text-success">Matching layout exists for this screen.</span>
                        ) : (
                          <span className="">No matching layout for current screen.</span>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {isCreatingLayout && (
                  <>
                    <div className="col-md-3">
                      <label className="form-label">Layout name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Layout name"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                      />
                      {isDuplicateLayoutName(nameInput, layouts) && (
                        <div className="form-text text-danger">Duplicate layout names are not allowed.</div>
                      )}
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Width</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Width"
                        value={widthInput}
                        onChange={(e) => setWidthInput(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Height</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Height"
                        value={heightInput}
                        onChange={(e) => setHeightInput(e.target.value)}
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAddLayout}
                        disabled={saving || !nameInput.trim() || !widthInput.trim() || !heightInput.trim() || isDuplicateLayoutName(nameInput, layouts)}
                      >
                        {saving ? 'Saving…' : 'Save Layout'}
                      </button>
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleCancelCreatingLayout}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                )}

                {!isCreatingLayout && layouts.length === 0 && (
                  <>
                    <div className="col-md-3">
                      <label className="form-label">Layout name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Layout name"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                      />
                      {isDuplicateLayoutName(nameInput, layouts) && (
                        <div className="form-text text-danger">Duplicate layout names are not allowed.</div>
                      )}
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Width</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Width"
                        value={widthInput}
                        onChange={(e) => setWidthInput(e.target.value)}
                      />
                    </div>
                    <div className="col-md-2">
                      <label className="form-label">Height</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="Height"
                        value={heightInput}
                        onChange={(e) => setHeightInput(e.target.value)}
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleAddLayout}
                        disabled={saving || !nameInput.trim() || !widthInput.trim() || !heightInput.trim() || isDuplicateLayoutName(nameInput, layouts)}
                      >
                        {saving ? 'Saving…' : 'Save Layout'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row gx-4">
        <div className="col-12">
          <div className="card layout-designer-panel h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h3 className="card-title mb-1">{hasLayout ? `Editing ${activeLayout.name || `${activeLayout.width}×${activeLayout.height}`}` : 'Create your first layout'}</h3>
                  <small className="">Right click any cell to add an item or adjust the grid.</small>
                </div>
                <div className=" text-end">
                  {hasLayout ? `${activeLayout.rows} rows × ${activeLayout.cols} columns` : null}
                </div>
              </div>
              {hasLayout ? (
                <>
                  {/* layout name moved to top controls to save vertical space */}
                  <div className="layout-designer-grid" onClick={clearSelection}>
                    <div className="layout-designer-grid-toolbar">
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={handleAddSection}
                        disabled={!activeLayout}
                      >
                        Add Section
                      </button>
                      <div className=" small">
                        Add a new section to the current layout.
                      </div>
                    </div>
                    {
                      // compute dialog width to force correct sizing (inline style overrides theme)
                    }
                    <Dialog
                      draggable
                      modal={false}
                      open={true}
                      title={activeLayout ? `${activeLayout.name || `${activeLayout.width}×${activeLayout.height}`} — Preview` : 'Preview'}
                      size="xl"
                      showCloseButton={false}
                      className="layout-designer-preview-dialog"
                      style={{
                        width: `${Math.min(Math.max(360, Math.round(layoutBaseWidth * layoutScale)), Math.min(900, Math.round(screenSize.width * 0.9)))}px`,
                      }}
                    >
                      <div
                        className="layout-designer-layout-viewer"
                        style={{ width: `${layoutBaseWidth * layoutScale}px`, height: `${layoutBaseHeight * layoutScale}px` }}
                      >
                        <div
                          className="layout-designer-layout-shell"
                          style={{
                            width: `${layoutBaseWidth * layoutScale}px`,
                            height: `${layoutBaseHeight * layoutScale}px`,
                          }}
                        >
                          <div className="layout-designer-layout-frame">
                            <div className="layout-designer-grid-body">
                              {Object.keys(cellMap).map((id) => {
                                const info = cellMap[id];
                                const cell = info.cell;
                                const row = info.row;
                                const col = info.col;
                                return (
                                  <div
                                    key={id}
                                    className={`layout-designer-cell${cell.itemKey ? ' layout-designer-cell--filled' : ''}${selectedCells.includes(id) ? ' layout-designer-cell--selected' : ''}`}
                                    onClick={(e) => handleCellClick(id, e)}
                                    onContextMenu={(e) => {
                                      e.preventDefault();
                                      setContextMenu({ x: e.clientX, y: e.clientY, row, col, cellId: id, cell });
                                    }}
                                  >
                                    {cell.itemKey ? (
                                      <div className="layout-designer-cell__content">{getCellKeyDisplay(cell.itemKey)}</div>
                                    ) : (
                                      <div className="layout-designer-cell__placeholder">
                                        Empty
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Dialog>
                  </div>
                </>
              ) : (
                <div className="alert alert-secondary">Add a new layout using the width/height controls to begin designing.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {contextMenu && (
        <ContextMenu
          variant="positioned"
          isOpen={!!contextMenu}
          onClose={closeContextMenu}
          position={contextMenu ? { x: contextMenu.x, y: contextMenu.y } : null}
          items={contextMenuItems}
        />
      )}

      <Toast toasts={toasts} />
    </div>
  );
};

export default LayoutDesigner;
