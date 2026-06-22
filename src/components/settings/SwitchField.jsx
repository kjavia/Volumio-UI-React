const SwitchField = ({ field, value, onChange }) => (
  <div className="settings-field settings-field--switch">
    <div className="settings-switch-row">
      <div>
        <label className="settings-label" htmlFor={field.id}>
          {field.icon && <span className="material-icons settings-field__icon">{field.icon}</span>}
          {field.label}
        </label>
        {field.doc && <small className="settings-doc">{field.doc}</small>}
      </div>
      <div className="form-check form-switch">
        <input
          id={field.id}
          className="form-check-input"
          type="checkbox"
          role="switch"
          checked={!!value}
          onChange={(e) => onChange(field.id, e.target.checked)}
        />
      </div>
    </div>
  </div>
);

export default SwitchField;
