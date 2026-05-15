import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import usePluginConfig from '@/hooks/usePluginConfig';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';
import ContextMenu from '@/components/ContextMenu';
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

const makeEmptyCells = (rows, cols) => Array.from({ length: rows }, () => Array.from({ length: cols }, () => null));

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
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const closeContextMenu = () => setContextMenu(null);

  useEffect(() => {
    const updateSize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (!pluginConfig) return;
    const designer = parseLayoutDesigner(pluginConfig.layoutDesigner);
    const newLayouts = Array.isArray(designer.layouts) ? designer.layouts : [];
    setLayouts(newLayouts);
    if (!activeLayoutId && newLayouts.length) {
      setActiveLayoutId(newLayouts[0].id);
    }
  }, [pluginConfig, activeLayoutId]);

  useEffect(() => {
    if (!layouts.length) {
      setActiveLayoutId(null);
    } else if (activeLayoutId && !layouts.some((layout) => layout.id === activeLayoutId)) {
      setActiveLayoutId(layouts[0]?.id || null);
    }
  }, [activeLayoutId, layouts]);

  const activeLayout = useMemo(
    () => layouts.find((layout) => layout.id === activeLayoutId) || layouts[0] || null,
    [layouts, activeLayoutId]
  );

  const activeItemKeys = useMemo(() => {
    if (!activeLayout) return [];
    return activeLayout.cells.flat().filter(Boolean);
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
    const newRow = Array(activeLayout.cols).fill(null);
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

  const handleAssignItem = useCallback((itemKey, row, col) => {
    if (!activeLayout) return;
    const cells = activeLayout.cells.map((rowCells, rowIndex) =>
      rowCells.map((cell, colIndex) => (rowIndex === row && colIndex === col ? itemKey : cell))
    );
    const updatedLayout = { ...activeLayout, cells };
    setLayouts((prev) => {
      const updated = prev.map((layout) => (layout.id === updatedLayout.id ? updatedLayout : layout));
      persistLayouts(updated);
      return updated;
    });
    setContextMenu(null);
  }, [activeLayout, persistLayouts]);

  const handleClearCell = useCallback((row, col) => {
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

  const contextMenuItems = useMemo(() => {
    if (!contextMenu) return [];
    const { row, col, cell } = contextMenu;
    return [
      { label: 'Add row above', icon: 'arrow_upward', onClick: () => handleInsertRow(row, 'above') },
      { label: 'Add row below', icon: 'arrow_downward', onClick: () => handleInsertRow(row, 'below') },
      { label: 'Add column left', icon: 'arrow_back', onClick: () => handleInsertColumn(col, 'left') },
      { label: 'Add column right', icon: 'arrow_forward', onClick: () => handleInsertColumn(col, 'right') },
      ...(cell
        ? [{ label: 'Remove item', icon: 'clear', onClick: () => handleClearCell(row, col) }]
        : [{
          label: 'Add item',
          icon: 'add',
          submenu: availableItems.map((item) => ({ label: item.label, icon: item.icon, onClick: () => handleAssignItem(item.key, row, col) })),
          empty: 'All items have been assigned.',
        }]
      ),
      { label: 'Remove cell', icon: 'delete', onClick: () => handleRemoveCell(row, col) },
    ];
  }, [contextMenu, availableItems, handleInsertRow, handleInsertColumn, handleClearCell, handleAssignItem, handleRemoveCell]);

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
                    <div className="col-md-4 text-end">
                      <div><strong>Current screen:</strong> {screenSize.width}×{screenSize.height}</div>
                      <div className="mt-2">
                        {matchedLayout ? (
                          <span className="text-success">Matching layout exists for this screen.</span>
                        ) : (
                          <span className="text-muted">No matching layout for current screen.</span>
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
                  <small className="text-muted">Right click any cell to add an item or adjust the grid.</small>
                </div>
                <div className="text-muted text-end">
                  {hasLayout ? `${activeLayout.rows} rows × ${activeLayout.cols} columns` : null}
                </div>
              </div>
              {hasLayout ? (
                <>
                  <div className="mb-3">
                    <label className="form-label">Layout name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={activeLayout.name || ''}
                      onChange={(e) => handleUpdateLayoutName(e.target.value)}
                    />
                  </div>
                  <div
                    className="layout-designer-grid"
                    style={{
                      gridTemplateColumns: `repeat(${activeLayout.cols}, minmax(100px, 1fr))`,
                      gridTemplateRows: `repeat(${activeLayout.rows}, minmax(100px, 1fr))`,
                    }}
                  >
                    {activeLayout.cells.map((rowCells, rowIndex) =>
                      rowCells.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`layout-designer-cell${cell ? ' layout-designer-cell--filled' : ''}`}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setContextMenu({
                              x: e.clientX,
                              y: e.clientY,
                              row: rowIndex,
                              col: colIndex,
                              cell,
                            });
                          }}
                        >
                          {cell ? (
                            <>
                              <div className="layout-designer-cell__content">{LAYOUT_ITEMS.find((item) => item.key === cell)?.label || cell}</div>
                            </>
                          ) : (
                            <div className="layout-designer-cell__placeholder">Right click to add</div>
                          )}
                        </div>
                      ))
                    )}
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
