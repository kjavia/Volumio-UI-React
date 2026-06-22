import { useEffect, useRef } from 'react';

const FontRowField = ({ field, nameValue, sizeValue, onChange }) => {
    const nameInfoRef = useRef(null);
    const sizeInfoRef = useRef(null);

    useEffect(() => {
        let nameTip, sizeTip;
        import('bootstrap/js/dist/tooltip').then(({ default: Tooltip }) => {
            if (nameInfoRef.current) nameTip = new Tooltip(nameInfoRef.current);
            if (sizeInfoRef.current) sizeTip = new Tooltip(sizeInfoRef.current);
        });
        return () => { nameTip?.dispose(); sizeTip?.dispose(); };
    }, []);

    return (
        <div className="settings-field settings-field--fontrow">
            <label className="settings-label">
                {field.icon && <span className="material-icons settings-field__icon">{field.icon}</span>}
                {field.label}
            </label>
            <div className="settings-fontrow-inputs">
                <div className="settings-fontrow-col settings-fontrow-col--name">
                    {field.nameLabel && <label className="settings-fontrow-col__label" htmlFor={field.nameId}>{field.nameLabel}</label>}
                    <div className="settings-fontrow-input-row">
                        <input
                            id={field.nameId}
                            className="form-control settings-input settings-fontrow-name"
                            type="text"
                            placeholder={field.namePlaceholder || 'e.g. Arial'}
                            value={nameValue ?? ''}
                            onChange={(e) => onChange(field.nameId, e.target.value)}
                        />
                        {field.nameDoc && (
                            <span
                                ref={nameInfoRef}
                                className="material-icons settings-fontrow-info"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title={field.nameDoc}
                            >info_outline</span>
                        )}
                    </div>
                </div>
                <div className="settings-fontrow-col settings-fontrow-col--size">
                    {field.sizeLabel && <label className="settings-fontrow-col__label" htmlFor={field.sizeId}>{field.sizeLabel}</label>}
                    <div className="settings-fontrow-input-row">
                        <input
                            id={field.sizeId}
                            className="form-control settings-input settings-fontrow-size"
                            type="text"
                            placeholder={field.sizePlaceholder || 'e.g. 16px'}
                            value={sizeValue ?? ''}
                            onChange={(e) => onChange(field.sizeId, e.target.value)}
                        />
                        {field.sizeDoc && (
                            <span
                                ref={sizeInfoRef}
                                className="material-icons settings-fontrow-info"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title={field.sizeDoc}
                            >info_outline</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FontRowField;
