import { useState } from 'react';

const JsonField = ({ field, value, onChange }) => {
    const [text, setText] = useState(() => {
        try { return JSON.stringify(JSON.parse(value || '{}'), null, 2); } catch { return value || '{}'; }
    });
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const v = e.target.value;
        setText(v);
        try {
            JSON.parse(v);
            setError(null);
            onChange(field.id, v);
        } catch (err) {
            setError(err.message);
        }
    };

    const handleFormat = () => {
        try {
            const parsed = JSON.parse(text);
            const pretty = JSON.stringify(parsed, null, 2);
            setText(pretty);
            onChange(field.id, pretty);
            setError(null);
        } catch { /* keep current text */ }
    };

    return (
        <div className="settings-field">
            <label className="settings-label">
                {field.icon && <span className="material-icons settings-field__icon">{field.icon}</span>}
                {field.label}
            </label>
            {field.doc && <small className="settings-doc">{field.doc}</small>}
            <div className="settings-json-editor">
                <button type="button" className="btn btn-sm btn-secondary settings-json-format" onClick={handleFormat} disabled={!!error}>
                    <span className="material-icons">auto_fix_high</span> Format
                </button>
                <textarea
                    className={`settings-json-textarea ${error ? 'settings-json-textarea--error' : ''}`}
                    value={text}
                    onChange={handleChange}
                    spellCheck={false}
                    rows={10}
                />
                {error && <small className="settings-json-error"><span className="material-icons">error_outline</span>{error}</small>}
            </div>
        </div>
    );
};

export default JsonField;
