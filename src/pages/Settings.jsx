import { useState, useEffect, useCallback } from 'react';
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
      { id: 'idleTimeout', element: 'input', type: 'number', label: 'Idle Timeout (minutes)', icon: 'hourglass_empty', doc: 'Minutes of inactivity before switching. Minimum 1.' },
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
      { id: 'slideshowInterval', element: 'input', type: 'number', label: 'Slideshow Interval (seconds)', icon: 'slideshow', doc: 'Time between wallpaper transitions. Minimum 5.' },
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

const ColorField = ({ field, value, onChange }) => (
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
      />
      {value && (
        <button type="button" className="settings-color-clear" onClick={() => onChange(field.id, '')} title="Clear color">
          <span className="material-icons">close</span>
        </button>
      )}
    </div>
  </div>
);
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
