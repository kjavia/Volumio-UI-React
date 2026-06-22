import { useState, useEffect, useRef, useCallback } from 'react';

const KnobField = ({ field, value, onChange }) => {
    const min = field.min ?? 1;
    const max = field.max ?? 60;
    const numValue = Math.max(min, Math.min(max, Number(value) || min));
    const knobRef = useRef(null);
    const dragging = useRef(false);
    const [inputText, setInputText] = useState(String(numValue));

    // Sync inputText when value changes externally (e.g. from knob drag)
    useEffect(() => {
        setInputText(String(numValue));
    }, [numValue]);

    const angleRange = 270;
    const valueToAngle = (v) => ((v - min) / (max - min)) * angleRange - angleRange / 2;
    const angleToValue = useCallback((deg) => {
        const clamped = Math.max(-angleRange / 2, Math.min(angleRange / 2, deg));
        return Math.round(((clamped + angleRange / 2) / angleRange) * (max - min) + min);
    }, [angleRange, max, min]);

    const rotation = valueToAngle(numValue);

    const getAngleFromEvent = useCallback((e, rect) => {
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        return Math.atan2(clientX - cx, cy - clientY) * (180 / Math.PI);
    }, []);

    const handlePointerDown = useCallback((e) => {
        e.preventDefault();
        dragging.current = true;
        const rect = knobRef.current.getBoundingClientRect();

        const onMove = (ev) => {
            if (!dragging.current) return;
            const angle = getAngleFromEvent(ev, rect);
            const newVal = angleToValue(angle);
            onChange(field.id, String(newVal));
        };

        const onUp = () => {
            dragging.current = false;
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onUp);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onUp);
    }, [field.id, onChange, getAngleFromEvent, angleToValue]);

    const handleWheel = useCallback((e) => {
        e.preventDefault();
        const delta = e.deltaY < 0 ? 1 : -1;
        const newVal = Math.max(min, Math.min(max, numValue + delta));
        onChange(field.id, String(newVal));
    }, [field.id, min, max, numValue, onChange]);

    const commitInput = (text) => {
        const parsed = parseInt(text, 10);
        if (!isNaN(parsed)) {
            const clamped = Math.max(min, Math.min(max, parsed));
            onChange(field.id, String(clamped));
            setInputText(String(clamped));
        } else {
            setInputText(String(numValue));
        }
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            commitInput(inputText);
            e.target.blur();
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
            if (inputText === '' || e.target.selectionStart === 0 && e.target.selectionEnd === inputText.length) {
                e.preventDefault();
                onChange(field.id, String(min));
                setInputText(String(min));
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const newVal = Math.min(max, numValue + 1);
            onChange(field.id, String(newVal));
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const newVal = Math.max(min, numValue - 1);
            onChange(field.id, String(newVal));
        }
    };

    const handleInputBlur = () => {
        commitInput(inputText);
    };

    return (
        <div className="settings-field">
            <label className="settings-label">
                {field.icon && <span className="material-icons settings-field__icon">{field.icon}</span>}
                {field.label}
            </label>
            {field.doc && <small className="settings-doc">{field.doc}</small>}
            <div className="settings-knob-container">
                <div className="settings-knob-track">
                    <svg className="settings-knob-scale" viewBox="0 0 100 100">
                        {Array.from({ length: max - min + 1 }, (_, i) => {
                            const val = min + i;
                            const a = ((val - min) / (max - min)) * angleRange - angleRange / 2;
                            const rad = (a - 90) * (Math.PI / 180);
                            const isMajor = val % 5 === 0;
                            const r1 = isMajor ? 42 : 44;
                            const r2 = 48;
                            return (
                                <line
                                    key={val}
                                    x1={50 + r1 * Math.cos(rad)} y1={50 + r1 * Math.sin(rad)}
                                    x2={50 + r2 * Math.cos(rad)} y2={50 + r2 * Math.sin(rad)}
                                    stroke="currentColor"
                                    strokeWidth={isMajor ? 1.2 : 0.5}
                                    opacity={isMajor ? 0.6 : 0.25}
                                />
                            );
                        })}
                    </svg>
                    <div
                        ref={knobRef}
                        className="settings-knob"
                        style={{ transform: `rotate(${rotation}deg)` }}
                        onMouseDown={handlePointerDown}
                        onTouchStart={handlePointerDown}
                        onWheel={handleWheel}
                        role="slider"
                        aria-valuemin={min}
                        aria-valuemax={max}
                        aria-valuenow={numValue}
                        tabIndex={0}
                    >
                        <div className="settings-knob__indicator" />
                    </div>
                </div>
                <input
                    type="number"
                    className="settings-knob-value"
                    value={inputText}
                    onChange={handleInputChange}
                    onKeyDown={handleInputKeyDown}
                    onBlur={handleInputBlur}
                    min={min}
                    max={max}
                />
            </div>
        </div>
    );
};

export default KnobField;
