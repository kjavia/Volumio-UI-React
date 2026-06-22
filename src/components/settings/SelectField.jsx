import { normalizeConfigValue } from '@/utils/pluginConfigValue';

const SelectField = ({ field, value, onChange, onDelete }) => (
    <div className="settings-field settings-field--select">
        <label className="settings-label">
            {field.icon && <span className="material-icons settings-field__icon">{field.icon}</span>}
            {field.label}
        </label>
        {field.doc && <small className="settings-doc">{field.doc}</small>}
        <div className="settings-radio-group">
            {field.options.map((opt) => (
                <div key={opt.value} className={`settings-radio-wrapper${opt.preview ? ' settings-radio-wrapper--has-preview' : ''}`}>
                    <label className={`btn ${normalizeConfigValue(value) === opt.value ? 'btn-primary' : 'btn-secondary'} settings-radio`}>
                        <input
                            type="radio"
                            name={field.id}
                            value={opt.value}
                            checked={normalizeConfigValue(value) === opt.value}
                            onChange={() => onChange(field.id, opt.value)}
                            className="settings-radio__input"
                        />
                        {opt.label}
                    </label>
                    {opt.preview && (
                        <div className="settings-radio-preview">
                            <img src={opt.preview} alt={opt.label} />
                        </div>
                    )}
                    {field.deletable && onDelete && (
                        <button
                            type="button"
                            className="settings-radio-delete"
                            title="Delete pack"
                            onClick={() => onDelete(opt.value, opt.label)}
                        >
                            <span className="material-icons">close</span>
                        </button>
                    )}
                </div>
            ))}
        </div>
    </div>
);

export default SelectField;
