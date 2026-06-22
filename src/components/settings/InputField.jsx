const InputField = ({ field, value, onChange }) => (
  <div className="settings-field settings-field--inline">
    <label className="settings-label" htmlFor={field.id}>
      {field.icon && <span className="material-icons settings-field__icon">{field.icon}</span>}
      {field.label}
    </label>
    {field.doc && <small className="settings-doc">{field.doc}</small>}
    <input
      id={field.id}
      className="form-control settings-input"
      type={field.type || 'text'}
      style={field.width ? { width: field.width } : undefined}
      value={value ?? ''}
      onChange={(e) => onChange(field.id, e.target.value)}
    />
  </div>
);

export default InputField;
