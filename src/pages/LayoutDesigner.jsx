import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import usePluginConfig from '@/hooks/usePluginConfig';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';
import { PLUGIN_BASE_URL } from '@/config';
import './layout-designer.scss';

const PLUGIN_ENDPOINT = 'user_interface/stylish_player';
const LAYOUT_ITEMS = [
  { key: 'trackName', label: 'Track Name' },
  { key: 'albumName', label: 'Album Name' },
  { key: 'artistName', label: 'Artist Name' },
  { key: 'serviceLogo', label: 'Service Logo' },
  { key: 'samplingRate', label: 'Sampling Rate' },
  { key: 'playerControls', label: 'Player Controls' },
  { key: 'player', label: 'Player' },
  { key: 'viz', label: 'Visualization' },
  { key: 'buttonRow', label: 'Button Row' },
  { key: 'volumeSlider', label: 'Volume Slider' },
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

const LayoutDesigner = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { data: pluginConfig, isLoading } = usePluginConfig();
  const { toasts, showToast } = useToast();
  const [layouts, setLayouts] = useState([]);
  const [activeLayoutId, setActiveLayoutId] = useState(null);
  const [widthInput, setWidthInput] = useState('');
  const [heightInput, setHeightInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });
  const menuRef = useRef(null);

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

  useEffect(() => {
    const handleClick = (event) => {
      if (contextMenu && menuRef.current && !menuRef.current.contains(event.target)) {
        setContextMenu(null);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [contextMenu]);

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

  const handleAddLayout = () => {
    const width = parseInt(widthInput, 10);
    const height = parseInt(heightInput, 10);
    if (Number.isNaN(width) || width <= 0 || Number.isNaN(height) || height <= 0) {
      showToast('Enter valid width and height in pixels.', 'error');
      return;
    }

    const newLayout = {
      id: `layout-${Date.now()}`,
      width,
      height,
      rows: 1,
      cols: 1,
      cells: makeEmptyCells(1, 1),
    };
    setLayouts((prev) => [...prev, newLayout]);
    setActiveLayoutId(newLayout.id);
    setWidthInput('');
    setHeightInput('');
  };

  const handleDeleteLayout = () => {
    if (!activeLayout) return;
    if (!window.confirm('Delete this layout?')) return;
    setLayouts((prev) => prev.filter((layout) => layout.id !== activeLayout.id));
    setContextMenu(null);
  };

  const handleAddRow = () => {
    if (!activeLayout) return;
    const cells = activeLayout.cells.map((row) => [...row]);
    cells.push(Array(activeLayout.cols).fill(null));
    updateLayout({ ...activeLayout, rows: activeLayout.rows + 1, cells });
    setContextMenu(null);
  };

  const handleAddColumn = () => {
    if (!activeLayout) return;
    const cells = activeLayout.cells.map((row) => [...row, null]);
    updateLayout({ ...activeLayout, cols: activeLayout.cols + 1, cells });
    setContextMenu(null);
  };

  const handleAssignItem = (itemKey) => {
    if (!activeLayout || !contextMenu) return;
    const { row, col } = contextMenu;
    const cells = activeLayout.cells.map((rowCells, rowIndex) =>
      rowCells.map((cell, colIndex) => (rowIndex === row && colIndex === col ? itemKey : cell))
    );
    updateLayout({ ...activeLayout, cells });
    setContextMenu(null);
  };

  const handleClearCell = (row, col) => {
    if (!activeLayout) return;
    const cells = activeLayout.cells.map((rowCells, rowIndex) =>
      rowCells.map((cell, colIndex) => (rowIndex === row && colIndex === col ? null : cell))
    );
    updateLayout({ ...activeLayout, cells });
    setContextMenu(null);
  };

  const handleSave = () => {
    if (!socket) {
      showToast('Unable to save layout. Connection not available.', 'error');
      return;
    }
    setSaving(true);

    const payload = {
      layoutDesigner: JSON.stringify({ layouts }),
    };

    socket.emit('callMethod', {
      endpoint: PLUGIN_ENDPOINT,
      method: 'configSaveLayoutDesigner',
      data: payload,
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
          <button type="button" className="btn btn-primary" onClick={handleSave} disabled={saving || !layouts.length}>
            <span className="material-icons">save</span>
            {saving ? 'Saving…' : 'Save Layouts'}
          </button>
        </div>
      </div>

      <div className="row gx-4">
        <div className="col-xl-4">
          <div className="card layout-designer-panel mb-4">
            <div className="card-body">
              <h3 className="card-title">Layouts</h3>
              <div className="mb-3">
                <label className="form-label">Select layout</label>
                <select
                  className="form-select"
                  value={activeLayoutId || ''}
                  onChange={(e) => handleChangeLayout(e.target.value)}
                >
                  {layouts.map((layout) => (
                    <option key={layout.id} value={layout.id}>
                      {layout.width}×{layout.height} ({layout.rows}×{layout.cols})
                    </option>
                  ))}
                  {!layouts.length && <option value="">No layouts defined</option>}
                </select>
              </div>
              <div className="row g-2 mb-3">
                <div className="col-6">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Width"
                    value={widthInput}
                    onChange={(e) => setWidthInput(e.target.value)}
                  />
                </div>
                <div className="col-6">
                  <input
                    type="number"
                    className="form-control"
                    placeholder="Height"
                    value={heightInput}
                    onChange={(e) => setHeightInput(e.target.value)}
                  />
                </div>
              </div>
              <div className="d-flex gap-2 mb-3">
                <button type="button" className="btn btn-outline-primary flex-grow-1" onClick={handleAddLayout}>
                  Add Layout
                </button>
                <button type="button" className="btn btn-outline-danger" onClick={handleDeleteLayout} disabled={!activeLayout}>
                  Delete
                </button>
              </div>
              <div className="card mt-3 bg-dark text-white p-3">
                <strong>Current screen:</strong>
                <div>{screenSize.width}×{screenSize.height}</div>
                <div className="mt-2">
                  {matchedLayout ? (
                    <span className="text-success">Matching layout exists for this screen.</span>
                  ) : (
                    <span className="text-muted">No matching layout for current screen.</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card layout-designer-panel mb-4">
            <div className="card-body">
              <h3 className="card-title">Layout controls</h3>
              <button type="button" className="btn btn-outline-secondary w-100 mb-2" onClick={handleAddRow} disabled={!activeLayout}>
                Add Row
              </button>
              <button type="button" className="btn btn-outline-secondary w-100" onClick={handleAddColumn} disabled={!activeLayout}>
                Add Column
              </button>
            </div>
          </div>

          <div className="card layout-designer-panel">
            <div className="card-body">
              <h3 className="card-title">Items</h3>
              <ul className="layout-designer-item-list list-unstyled mb-0">
                {LAYOUT_ITEMS.map((item) => (
                  <li
                    key={item.key}
                    className={`layout-designer-item${activeItemKeys.includes(item.key) ? ' layout-designer-item--used' : ''}`}
                  >
                    {item.label}
                    {activeItemKeys.includes(item.key) && <span className="badge bg-secondary ms-2">Used</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="col-xl-8">
          <div className="card layout-designer-panel h-100">
            <div className="card-body">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div>
                  <h3 className="card-title mb-1">{hasLayout ? `Editing ${activeLayout.width}×${activeLayout.height}` : 'Create your first layout'}</h3>
                  <small className="text-muted">Right click an empty cell to assign an item.</small>
                </div>
                <div className="text-muted text-end">
                  {hasLayout ? `${activeLayout.rows} rows × ${activeLayout.cols} columns` : null}
                </div>
              </div>
              {hasLayout ? (
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
                          if (cell) return;
                          e.preventDefault();
                          setContextMenu({ x: e.clientX, y: e.clientY, row: rowIndex, col: colIndex });
                        }}
                      >
                        {cell ? (
                          <>
                            <div className="layout-designer-cell__content">{LAYOUT_ITEMS.find((item) => item.key === cell)?.label || cell}</div>
                            <button
                              type="button"
                              className="layout-designer-cell__remove"
                              onClick={() => handleClearCell(rowIndex, colIndex)}
                              aria-label="Clear cell"
                            >
                              <span className="material-icons">close</span>
                            </button>
                          </>
                        ) : (
                          <div className="layout-designer-cell__placeholder">Right click to add</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="alert alert-secondary">Add a new layout using the width/height controls to begin designing.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {contextMenu && (
        <div
          ref={menuRef}
          className="layout-designer-context-menu"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          {availableItems.length ? (
            availableItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className="layout-designer-context-menu__item"
                onClick={() => handleAssignItem(item.key)}
              >
                {item.label}
              </button>
            ))
          ) : (
            <div className="layout-designer-context-menu__empty">All items have been assigned.</div>
          )}
        </div>
      )}

      <Toast toasts={toasts} />
    </div>
  );
};

export default LayoutDesigner;
