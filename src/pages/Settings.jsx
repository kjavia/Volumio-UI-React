import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '@/contexts/SocketContext';
import usePluginConfig from '@/hooks/usePluginConfig';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';
import './settings.scss';

/* ═══════════════════════════════════════════════════════════════════════
   UIConfig section definitions
   Mirrors UIConfig.json but only the editable sections (skip daemon, app info, kiosk).
   Each section defines its fields, the save method, and which field IDs to send.
   ═══════════════════════════════════════════════════════════════════════ */

const SECTIONS = [
  {
    id: 'section_player_config',
    label: 'Player Configuration',
    icon: 'tune',
    method: 'configSavePlayerConfig',
    fields: [
      {
        id: 'theme', element: 'select', label: 'Theme', icon: 'palette',
        doc: 'Select the UI theme for different visual styles.',
        options: [
          { value: 'skeuomorphic', label: 'Skeuomorphic' },
          { value: 'metallic', label: 'Metallic' },
          { value: 'brushed-metal', label: 'Brushed Metal' },
          { value: 'aqua', label: 'Aqua' },
          { value: 'flat', label: 'Flat' },
          { value: 'win95', label: 'Windows 95' },
          { value: 'casio', label: 'Casio 80s' },
          { value: 'oled', label: 'OLED' },
        ],
      },
      {
        id: 'playerType', element: 'select', label: 'Player Type', icon: 'album',
        doc: 'Select which player visual is displayed.',
        options: [
          { value: 'albumArt', label: 'Album Art' },
          { value: 'vinyl', label: 'Vinyl' },
          { value: 'vinylCover', label: 'Vinyl Cover' },
          { value: 'cd', label: 'CD' },
          { value: 'cdCover', label: 'CD Cover' },
          { value: 'cassette', label: 'Cassette' },
          { value: 'reelToReel', label: 'Reel to Reel' },
          { value: 'radio', label: 'Radio' },
          { value: 'globe', label: 'Globe' },
          { value: 'matchSource', label: 'Match Source' },
          { value: 'random', label: 'Random' },
          { value: 'none', label: 'None' },
        ],
      },
      { id: 'showPlayerControls', element: 'switch', label: 'Show Player Controls', icon: 'gamepad', doc: 'When disabled, player buttons are hidden.' },
      { id: 'showRemainingTime', element: 'switch', label: 'Show Remaining Time', icon: 'timer', doc: 'Show remaining time instead of total duration.' },
      { id: 'albumArtMaxSpace', element: 'switch', label: 'Use Maximum Space', icon: 'aspect_ratio', doc: 'Expand album art to fill the panel.', visibleIf: { field: 'playerType', value: 'albumArt' } },
      { id: 'showTrackPanel', element: 'switch', label: 'Show Track Info Panel', icon: 'info', doc: 'Display a themed panel behind track info.' },
      {
        id: 'vizType', element: 'select', label: 'Visualization', icon: 'equalizer',
        doc: 'Select the visualization displayed on the player screen.',
        options: [
          { value: 'spectrum', label: 'Spectrum Analyzer' },
          { value: 'vuMeter1', label: 'VU Meter 1 (Orange)' },
          { value: 'vuMeter2', label: 'VU Meter 2 (Blue)' },
          { value: 'vuMeter3', label: 'VU Meter 3 (Yellow)' },
          { value: 'vuMeter4', label: 'VU Meter 4 (Black)' },
          { value: 'peppyMeter', label: 'Peppy Meter' },
          { value: 'none', label: 'None' },
        ],
      },
      { id: 'spectrumOptions', element: 'json', label: 'Spectrum Options (JSON)', icon: 'data_object', doc: 'Override AudioMotion Analyzer options.', visibleIf: { field: 'vizType', value: 'spectrum' } },
      { id: 'peppyMeterWidth', element: 'input', type: 'number', label: 'Peppy Meter Width (px)', icon: 'width', visibleIf: { field: 'vizType', value: 'peppyMeter' } },
      { id: 'peppyMeterHeight', element: 'input', type: 'number', label: 'Peppy Meter Height (px)', icon: 'height', visibleIf: { field: 'vizType', value: 'peppyMeter' } },
    ],
  },
  {
    id: 'section_colors',
    label: 'Colors',
    icon: 'palette',
    method: 'configSaveColors',
    fields: [
      { id: 'backgroundColor', element: 'color', label: 'Background Color', icon: 'format_color_fill', doc: 'Leave empty for album art background.' },
      { id: 'trackColor', element: 'color', label: 'Track Title Color', icon: 'title', doc: 'Leave empty for theme default.' },
      { id: 'artistColor', element: 'color', label: 'Artist Name Color', icon: 'person' },
      { id: 'albumColor', element: 'color', label: 'Album Name Color', icon: 'album' },
      { id: 'streamInfoColor', element: 'color', label: 'Stream Info Color', icon: 'stream' },
      { id: 'controlColor', element: 'color', label: 'Control Color', icon: 'touch_app', doc: 'Color of player buttons, sliders, and labels.' },
    ],
  },
  {
    id: 'section_idle_screen',
    label: 'Idle Screen',
    icon: 'pause_circle',
    method: 'configSaveIdleScreen',
    fields: [
      {
        id: 'idleScreen', element: 'select', label: 'Idle Screen Type', icon: 'tv',
        doc: 'Which screen to display when playback is idle.',
        options: [
          { value: 'analogClock', label: 'Analog Clock' },
          { value: 'digitalClock', label: 'Digital Clock' },
          { value: 'flipClock', label: 'Flip Clock' },
          { value: 'weatherCurrent', label: 'Weather (Current)' },
          { value: 'weatherHourly', label: 'Weather (Hourly)' },
          { value: 'weatherDaily', label: 'Weather (Daily)' },
          { value: 'weatherFull', label: 'Weather (Full)' },
          { value: 'wallpaper', label: 'Wallpaper' },
          { value: 'externalUrl', label: 'External URL' },
        ],
      },
      { id: 'externalUrl', element: 'input', type: 'text', label: 'External URL', icon: 'link', doc: 'Full URL to load in an iframe.', visibleIf: { field: 'idleScreen', value: 'externalUrl' } },
      { id: 'idleTimeout', element: 'knob', label: 'Idle Timeout (minutes)', icon: 'hourglass_empty', doc: 'Minutes of inactivity before switching.', min: 1, max: 60 },
    ],
  },
  {
    id: 'section_clock',
    label: 'Clock',
    icon: 'schedule',
    method: 'configSaveClock',
    fields: [
      { id: 'use24Hour', element: 'switch', label: '24-Hour Time', icon: 'access_time' },
      { id: 'showWeatherInClock', element: 'switch', label: 'Show Weather in Clock', icon: 'cloud', doc: 'Display weather on the clock face.' },
      { id: 'analogClockShowDate', element: 'switch', label: 'Show Date on Analog Clock', icon: 'event' },
    ],
  },
  {
    id: 'section_weather',
    label: 'Weather',
    icon: 'cloud',
    method: 'configSaveWeather',
    fields: [
      { id: 'latitude', element: 'input', type: 'text', label: 'Latitude', icon: 'explore', doc: 'e.g. 51.5074 for London' },
      { id: 'longitude', element: 'input', type: 'text', label: 'Longitude', icon: 'explore', doc: 'e.g. -0.1278 for London' },
      { id: 'weatherApiKey', element: 'input', type: 'text', label: 'API Key (Optional)', icon: 'vpn_key', doc: 'Open-Meteo API key. Free tier does not require one.' },
      {
        id: 'unitSystem', element: 'select', label: 'Unit System', icon: 'straighten',
        options: [
          { value: 'metric', label: 'Metric (°C, km/h)' },
          { value: 'imperial', label: 'Imperial (°F, mph)' },
        ],
      },
    ],
  },
  {
    id: 'section_wallpaper',
    label: 'Wallpaper',
    icon: 'wallpaper',
    method: 'configSaveWallpaper',
    fields: [
      { id: 'unsplashApiKey', element: 'input', type: 'text', label: 'Unsplash API Key', icon: 'vpn_key' },
      { id: 'wallpaperUrl', element: 'input', type: 'text', label: 'Wallpaper URL', icon: 'wallpaper' },
      { id: 'wallpaperShowTime', element: 'switch', label: 'Show Time on Wallpaper', icon: 'schedule' },
      { id: 'wallpaperShowSeconds', element: 'switch', label: 'Show Seconds on Wallpaper', icon: 'update' },
      { id: 'wallpaperShowWeather', element: 'switch', label: 'Show Weather on Wallpaper', icon: 'thermostat' },
      { id: 'slideshowInterval', element: 'knob', label: 'Slideshow Interval (seconds)', icon: 'slideshow', doc: 'Time between wallpaper transitions.', min: 5, max: 120 },
    ],
  },
];

const PLUGIN_ENDPOINT = 'user_interface/stylish_player';

/* ─── Field Components ─────────────────────────────────────────────────── */

const SelectField = ({ field, value, onChange }) => (
  <div className="settings-field settings-field--select">
    <label className="settings-label">
      {field.icon && <span className="material-icons settings-field__icon">{field.icon}</span>}
      {field.label}
    </label>
    {field.doc && <small className="settings-doc">{field.doc}</small>}
    <div className="settings-radio-group">
      {field.options.map((opt) => (
        <label key={opt.value} className={`btn ${value === opt.value ? 'btn-primary' : 'btn-secondary'} settings-radio`}>
          <input
            type="radio"
            name={field.id}
            value={opt.value}
            checked={value === opt.value}
            onChange={() => onChange(field.id, opt.value)}
            className="settings-radio__input"
          />
          {opt.label}
        </label>
      ))}
    </div>
  </div>
);
SelectField.propTypes = { field: PropTypes.object.isRequired, value: PropTypes.string, onChange: PropTypes.func.isRequired };

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
SwitchField.propTypes = { field: PropTypes.object.isRequired, value: PropTypes.bool, onChange: PropTypes.func.isRequired };

const colorNameToHex = (name) => {
  const ctx = document.createElement('canvas').getContext('2d');
  ctx.fillStyle = name;
  const resolved = ctx.fillStyle; // returns '#rrggbb' or 'rgba(...)' for valid colors
  if (resolved.startsWith('#')) return resolved;
  return null;
};

const ColorField = ({ field, value, onChange }) => {
  const handleBlur = (e) => {
    const text = e.target.value.trim();
    if (!text || text.startsWith('#')) return;
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
      </div>
    </div>
  );
};
ColorField.propTypes = { field: PropTypes.object.isRequired, value: PropTypes.string, onChange: PropTypes.func.isRequired };

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
      value={value ?? ''}
      onChange={(e) => onChange(field.id, e.target.value)}
    />
  </div>
);
InputField.propTypes = { field: PropTypes.object.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), onChange: PropTypes.func.isRequired };

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
JsonField.propTypes = { field: PropTypes.object.isRequired, value: PropTypes.string, onChange: PropTypes.func.isRequired };

/* ─── Knob Field ───────────────────────────────────────────────────────── */
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
  const angleToValue = (deg) => {
    const clamped = Math.max(-angleRange / 2, Math.min(angleRange / 2, deg));
    return Math.round(((clamped + angleRange / 2) / angleRange) * (max - min) + min);
  };

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
  }, [field.id, onChange, getAngleFromEvent]);

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
KnobField.propTypes = { field: PropTypes.object.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), onChange: PropTypes.func.isRequired };

/* ─── Section Component ────────────────────────────────────────────────── */

const SettingsSection = ({ section, values, onChange, onSave, saving }) => {
  const isFieldVisible = (field) => {
    if (!field.visibleIf) return true;
    return values[field.visibleIf.field] === field.visibleIf.value;
  };

  return (
    <div className="settings-section">
      <div className="settings-section__header">
        <span className="material-icons settings-section__icon">{section.icon}</span>
        <h3 className="settings-section__title">{section.label}</h3>
      </div>
      <div className="settings-section__body">
        {section.fields.map((field) => {
          if (!isFieldVisible(field)) return null;
          switch (field.element) {
            case 'select':
              return <SelectField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
            case 'switch':
              return <SwitchField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
            case 'color':
              return <ColorField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
            case 'input':
              return <InputField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
            case 'json':
              return <JsonField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
            case 'knob':
              return <KnobField key={field.id} field={field} value={values[field.id]} onChange={onChange} />;
            default:
              return null;
          }
        })}
      </div>
      <div className="settings-section__footer">
        <button className="btn btn-primary" onClick={() => onSave(section)} disabled={saving}>
          <span className="material-icons">{saving ? 'hourglass_top' : 'save'}</span>
          {saving ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  );
};
SettingsSection.propTypes = {
  section: PropTypes.object.isRequired,
  values: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  saving: PropTypes.bool,
};

/* ═══════════════════════════════════════════════════════════════════════
   Settings Page
   ═══════════════════════════════════════════════════════════════════════ */

const Settings = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { data: pluginConfig, isLoading } = usePluginConfig();
  const { toasts, showToast } = useToast();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(SECTIONS[0].id);

  // Populate form values from plugin config
  useEffect(() => {
    if (pluginConfig) {
      setValues((prev) => {
        // Only set initial values, don't overwrite user edits
        const hasValues = Object.keys(prev).length > 0;
        if (hasValues) return prev;
        return { ...pluginConfig };
      });
    }
  }, [pluginConfig]);

  const handleChange = useCallback((id, val) => {
    setValues((prev) => ({ ...prev, [id]: val }));
  }, []);

  const handleSave = useCallback((section) => {
    if (!socket) return;
    setSaving(true);

    // Build the data payload matching what the backend expects
    const data = {};
    for (const field of section.fields) {
      const val = values[field.id];
      if (field.element === 'select') {
        // Backend expects { value, label } for selects
        const opt = field.options.find((o) => o.value === val);
        data[field.id] = opt || { value: val, label: val };
      } else {
        data[field.id] = val;
      }
    }

    socket.emit('callMethod', {
      endpoint: PLUGIN_ENDPOINT,
      method: section.method,
      data,
    });

    // Listen for the pushToastMessage from Volumio
    const handleToast = (payload) => {
      socket.off('pushStylishPlayerConfig', handleConfigPush);
      const msg = payload?.message || payload?.title || 'Done';
      const type = payload?.type === 'error' ? 'error' : 'success';
      showToast(msg, type);
      setSaving(false);
    };

    // Also handle config push as success signal
    const handleConfigPush = () => {
      socket.off('pushToastMessage', handleToast);
      showToast(`${section.label} saved`, 'success');
      setSaving(false);
    };

    socket.once('pushToastMessage', handleToast);
    socket.once('pushStylishPlayerConfig', handleConfigPush);

    // Timeout fallback
    setTimeout(() => {
      socket.off('pushToastMessage', handleToast);
      socket.off('pushStylishPlayerConfig', handleConfigPush);
      setSaving(false);
    }, 5000);
  }, [socket, values, showToast]);

  if (isLoading) {
    return (
      <div className="settings-page d-flex align-items-center justify-content-center">
        <span className="material-icons spin">sync</span>
      </div>
    );
  }

  const activeSection = SECTIONS.find((s) => s.id === activeTab);

  return (
    <div className="settings-page">
      <div className="settings-topbar">
        <button className="btn btn-icon" onClick={() => navigate(-1)} aria-label="Back">
          <span className="material-icons">arrow_back</span>
        </button>
        <h2 className="settings-topbar__title">Settings</h2>
      </div>
      <div className="settings-tabs" role="tablist">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            className={`settings-tab ${activeTab === section.id ? 'settings-tab--active' : ''}`}
            role="tab"
            aria-selected={activeTab === section.id}
            onClick={() => setActiveTab(section.id)}
          >
            <span className="material-icons settings-tab__icon">{section.icon}</span>
            <span className="settings-tab__label">{section.label}</span>
          </button>
        ))}
      </div>
      <div className="settings-content">
        {activeSection && (
          <SettingsSection
            key={activeSection.id}
            section={activeSection}
            values={values}
            onChange={handleChange}
            onSave={handleSave}
            saving={saving}
          />
        )}
      </div>
      <Toast toasts={toasts} />
    </div>
  );
};

export default Settings;
