import { useEffect, useRef } from 'react';

const colorNameToHex = (name) => {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = name;
  const resolved = ctx.fillStyle; // returns '#rrggbb' or 'rgba(...)' for valid colors
  if (resolved.startsWith('#')) return resolved;
  return null;
};

const ColorField = ({ field, value, onChange }) => {
  const infoRef = useRef(null);

  useEffect(() => {
    let tip;
    import('bootstrap/js/dist/tooltip').then(({ default: Tooltip }) => {
      if (infoRef.current) tip = new Tooltip(infoRef.current);
    });
    return () => tip?.dispose();
  }, []);

  const handleBlur = (e) => {
    const text = e.target.value.trim();
    if (!text || text.startsWith('#')) return;
    if (/^[0-9a-fA-F]{6}$/.test(text) || /^[0-9a-fA-F]{3}$/.test(text)) {
      onChange(field.id, '#' + text);
      return;
    }
    const hex = colorNameToHex(text);
    if (hex) onChange(field.id, hex);
  };

  return (
    <div className="settings-field settings-field--inline">
      <label className="settings-label" htmlFor={field.id}>
        {field.icon && <span className="material-icons settings-field__icon">{field.icon}</span>}
        {field.label}
      </label>
      {field.doc && <small className="settings-doc">{field.doc}</small>}
      <div className="settings-color-group">
        <input
          type="color"
          className="settings-color-picker"
          value={value || '#ffffff'}
          onChange={(e) => onChange(field.id, e.target.value)}
        />
        <input
          id={field.id}
          className="form-control settings-input"
          type="text"
          placeholder="#000000"
          value={value ?? ''}
          onChange={(e) => onChange(field.id, e.target.value)}
          onBlur={handleBlur}
        />
        {value && (
          <button type="button" className="settings-color-clear" onClick={() => onChange(field.id, '')} title="Clear color">
            <span className="material-icons">close</span>
          </button>
        )}
        <span
          ref={infoRef}
          className="material-icons settings-color-info"
          data-bs-toggle="tooltip"
          data-bs-placement="top"
          title="Enter HTML hex code OR a valid HTML color name"
        >info_outline</span>
      </div>
    </div>
  );
};

export default ColorField;
