import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PLUGIN_BASE_URL } from '@/config';
import { useSocket } from '@/contexts/SocketContext';
import usePluginConfig from '@/hooks/usePluginConfig';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';
import './settings.scss';

const PLUGIN_ENDPOINT = 'user_interface/stylish_player';

/* ─── Translation hook — fetches i18n strings from REST API ────────────── */
const useSettingsTranslations = () => {
  const [strings, setStrings] = useState({});

  useEffect(() => {
    axios.get(`${PLUGIN_BASE_URL}/api/translations`)
      .then(({ data }) => { if (data && typeof data === 'object') setStrings(data); })
      .catch(() => { });
  }, []);

  return useCallback((key, fallback) => strings[key] || fallback || key, [strings]);
};

/* ═══════════════════════════════════════════════════════════════════════
   UIConfig section definitions
   Mirrors UIConfig.json but only the editable sections (skip daemon, app info, kiosk).
   Each section defines its fields, the save method, and which field IDs to send.
   ═══════════════════════════════════════════════════════════════════════ */

const getSections = (t, peppyFolders = []) => {
  // Build folder options from the API response
  const peppyFolderOptions = peppyFolders.map((f) => ({
    value: f.folder,
    label: `${f.name} (${f.width}×${f.height})`,
  }));

  return [
    {
      id: 'section_player_config',
      label: t('PLAYER_CONFIG', 'Player Configuration'),
      icon: 'tune',
      method: 'configSavePlayerConfig',
      fields: [
        {
          id: 'theme', element: 'select', label: t('THEME', 'Theme'), icon: 'palette',
          doc: t('THEME_DESC', 'Select the UI theme for different visual styles.'),
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
          id: 'playerType', element: 'select', label: t('PLAYER_TYPE', 'Player Type'), icon: 'album',
          doc: t('PLAYER_TYPE_DESC', 'Select which player visual is displayed.'),
          options: [
            { value: 'albumArt', label: t('PLAYER_TYPE_ALBUM_ART', 'Album Art') },
            { value: 'vinyl', label: t('PLAYER_TYPE_VINYL', 'Vinyl') },
            { value: 'vinylCover', label: t('PLAYER_TYPE_VINYL_COVER', 'Vinyl Cover') },
            { value: 'cd', label: t('PLAYER_TYPE_CD', 'CD') },
            { value: 'cdCover', label: t('PLAYER_TYPE_CD_COVER', 'CD Cover') },
            { value: 'cassette', label: t('PLAYER_TYPE_CASSETTE', 'Cassette') },
            { value: 'reelToReel', label: t('PLAYER_TYPE_REEL_TO_REEL', 'Reel to Reel') },
            { value: 'radio', label: t('PLAYER_TYPE_RADIO', 'Radio') },
            { value: 'globe', label: t('PLAYER_TYPE_GLOBE', 'Globe') },
            { value: 'matchSource', label: t('PLAYER_TYPE_MATCH_SOURCE', 'Match Source') },
            { value: 'random', label: t('PLAYER_TYPE_RANDOM', 'Random') },
            { value: 'none', label: t('NONE', 'None') },
          ],
        },
        { id: 'showPlayerControls', element: 'switch', label: t('SHOW_PLAYER_CONTROLS', 'Show Player Controls'), icon: 'gamepad', doc: t('SHOW_PLAYER_CONTROLS_DESC', 'When disabled, player buttons are hidden.') },
        { id: 'showRemainingTime', element: 'switch', label: t('SHOW_REMAINING_TIME', 'Show Remaining Time'), icon: 'timer', doc: t('SHOW_REMAINING_TIME_DESC', 'Show remaining time instead of total duration.') },
        { id: 'albumArtMaxSpace', element: 'switch', label: t('ALBUM_ART_MAX_SPACE', 'Use Maximum Space'), icon: 'aspect_ratio', doc: t('ALBUM_ART_MAX_SPACE_DESC', 'Expand album art to fill the panel.'), visibleIf: { field: 'playerType', value: 'albumArt' } },
        { id: 'showTrackPanel', element: 'switch', label: t('SHOW_TRACK_PANEL', 'Show Track Info Panel'), icon: 'info', doc: t('SHOW_TRACK_PANEL_DESC', 'Display a themed panel behind track info.') },
        {
          id: 'vizType', element: 'select', label: t('VIZ_TYPE', 'Visualization'), icon: 'equalizer',
          doc: t('VIZ_TYPE_DESC', 'Select the visualization displayed on the player screen.'),
          options: [
            { value: 'spectrum', label: t('VIZ_TYPE_SPECTRUM', 'Spectrum Analyzer') },
            { value: 'peppyMeter', label: t('VIZ_TYPE_PEPPY_METER', 'Peppy Meter') },
            { value: 'none', label: t('NONE', 'None') },
          ],
        },
        { id: 'spectrumOptions', element: 'json', label: t('SPECTRUM_OPTIONS', 'Spectrum Options (JSON)'), icon: 'data_object', doc: t('SPECTRUM_OPTIONS_DESC', 'Override AudioMotion Analyzer options.'), visibleIf: { field: 'vizType', value: 'spectrum' } },
        {
          id: 'peppyMeterFolder', element: 'select', label: t('PEPPY_METER_FOLDER', 'Peppy Meter Pack'), icon: 'folder',
          doc: t('PEPPY_METER_FOLDER_DESC', 'Select the meter asset pack.'),
          options: peppyFolderOptions,
          visibleIf: { field: 'vizType', value: 'peppyMeter' },
        },
        {
          id: 'peppyMeterModel', element: 'select', label: t('PEPPY_METER_MODEL', 'Peppy Meter Model'), icon: 'speed',
          doc: t('PEPPY_METER_MODEL_DESC', 'Select a specific meter design, or Random to cycle on each track change.'),
          options: [], // Populated dynamically by SettingsSection based on selected folder
          dynamicOptionsFrom: 'peppyMeterFolder', // marker for dynamic options
          visibleIf: { field: 'vizType', value: 'peppyMeter' },
        },
      ],
    },
    {
      id: 'section_colors',
      label: t('COLORS', 'Colors'),
      icon: 'palette',
      method: 'configSaveColors',
      fields: [
        { id: 'backgroundColor', element: 'color', label: t('BACKGROUND_COLOR', 'Background Color'), icon: 'format_color_fill', doc: t('BACKGROUND_COLOR_DESC', 'Leave empty for album art background.') },
        { id: 'trackColor', element: 'color', label: t('TRACK_COLOR', 'Track Title Color'), icon: 'title', doc: t('TRACK_COLOR_DESC', 'Leave empty for theme default.') },
        { id: 'artistColor', element: 'color', label: t('ARTIST_COLOR', 'Artist Name Color'), icon: 'person' },
        { id: 'albumColor', element: 'color', label: t('ALBUM_COLOR', 'Album Name Color'), icon: 'album' },
        { id: 'streamInfoColor', element: 'color', label: t('STREAM_INFO_COLOR', 'Stream Info Color'), icon: 'stream' },
        { id: 'controlColor', element: 'color', label: t('CONTROL_COLOR', 'Control Color'), icon: 'touch_app', doc: t('CONTROL_COLOR_DESC', 'Color of player buttons, sliders, and labels.') },
      ],
    },
    {
      id: 'section_idle_screen',
      label: t('IDLE_SCREEN', 'Idle Screen'),
      icon: 'pause_circle',
      method: 'configSaveIdleScreen',
      fields: [
        {
          id: 'idleScreen', element: 'select', label: t('IDLE_SCREEN_TYPE', 'Idle Screen Type'), icon: 'tv',
          doc: t('IDLE_SCREEN_TYPE_DESC', 'Which screen to display when playback is idle.'),
          options: [
            { value: 'analogClock', label: t('IDLE_SCREEN_ANALOG_CLOCK', 'Analog Clock') },
            { value: 'digitalClock', label: t('IDLE_SCREEN_DIGITAL_CLOCK', 'Digital Clock') },
            { value: 'flipClock', label: t('IDLE_SCREEN_FLIP_CLOCK', 'Flip Clock') },
            { value: 'weatherCurrent', label: t('IDLE_SCREEN_WEATHER_CURRENT', 'Weather (Current)') },
            { value: 'weatherHourly', label: t('IDLE_SCREEN_WEATHER_HOURLY', 'Weather (Hourly)') },
            { value: 'weatherDaily', label: t('IDLE_SCREEN_WEATHER_DAILY', 'Weather (Daily)') },
            { value: 'weatherFull', label: t('IDLE_SCREEN_WEATHER_FULL', 'Weather (Full)') },
            { value: 'wallpaper', label: t('IDLE_SCREEN_WALLPAPER', 'Wallpaper') },
            { value: 'externalUrl', label: t('IDLE_SCREEN_EXTERNAL_URL', 'External URL') },
          ],
        },
        { id: 'externalUrl', element: 'input', type: 'text', label: t('EXTERNAL_URL', 'External URL'), icon: 'link', doc: t('EXTERNAL_URL_DESC', 'Full URL to load in an iframe.'), visibleIf: { field: 'idleScreen', value: 'externalUrl' } },
        { id: 'idleTimeout', element: 'knob', label: t('IDLE_TIMEOUT', 'Idle Timeout (minutes)'), icon: 'hourglass_empty', doc: t('IDLE_TIMEOUT_DESC', 'Minutes of inactivity before switching.'), min: 1, max: 60 },
      ],
    },
    {
      id: 'section_clock',
      label: t('CLOCK', 'Clock'),
      icon: 'schedule',
      method: 'configSaveClock',
      fields: [
        { id: 'use24Hour', element: 'switch', label: t('USE_24_HOUR', '24-Hour Time'), icon: 'access_time' },
        { id: 'showWeatherInClock', element: 'switch', label: t('SHOW_WEATHER_IN_CLOCK', 'Show Weather in Clock'), icon: 'cloud', doc: t('SHOW_WEATHER_IN_CLOCK_DESC', 'Display weather on the clock face.') },
        { id: 'analogClockShowDate', element: 'switch', label: t('ANALOG_CLOCK_SHOW_DATE', 'Show Date on Analog Clock'), icon: 'event' },
      ],
    },
    {
      id: 'section_weather',
      label: t('WEATHER', 'Weather'),
      icon: 'cloud',
      method: 'configSaveWeather',
      fields: [
        { id: 'latitude', element: 'input', type: 'text', label: t('LATITUDE', 'Latitude'), icon: 'explore', doc: t('LATITUDE_DESC', 'e.g. 51.5074 for London') },
        { id: 'longitude', element: 'input', type: 'text', label: t('LONGITUDE', 'Longitude'), icon: 'explore', doc: t('LONGITUDE_DESC', 'e.g. -0.1278 for London') },
        { id: 'weatherApiKey', element: 'input', type: 'text', label: t('WEATHER_API_KEY', 'API Key (Optional)'), icon: 'vpn_key', doc: t('WEATHER_API_KEY_DESC', 'Open-Meteo API key. Free tier does not require one.') },
        {
          id: 'unitSystem', element: 'select', label: t('UNIT_SYSTEM', 'Unit System'), icon: 'straighten',
          options: [
            { value: 'metric', label: t('UNIT_METRIC', 'Metric (°C, km/h)') },
            { value: 'imperial', label: t('UNIT_IMPERIAL', 'Imperial (°F, mph)') },
          ],
        },
      ],
    },
    {
      id: 'section_wallpaper',
      label: t('WALLPAPER', 'Wallpaper'),
      icon: 'wallpaper',
      method: 'configSaveWallpaper',
      fields: [
        { id: 'unsplashApiKey', element: 'input', type: 'text', label: t('UNSPLASH_API_KEY', 'Unsplash API Key'), icon: 'vpn_key' },
        { id: 'wallpaperUrl', element: 'input', type: 'text', label: t('WALLPAPER_URL', 'Wallpaper URL'), icon: 'wallpaper' },
        { id: 'wallpaperShowTime', element: 'switch', label: t('WALLPAPER_SHOW_TIME', 'Show Time on Wallpaper'), icon: 'schedule' },
        { id: 'wallpaperShowSeconds', element: 'switch', label: t('WALLPAPER_SHOW_SECONDS', 'Show Seconds on Wallpaper'), icon: 'update' },
        { id: 'wallpaperShowWeather', element: 'switch', label: t('WALLPAPER_SHOW_WEATHER', 'Show Weather on Wallpaper'), icon: 'thermostat' },
        { id: 'slideshowInterval', element: 'knob', label: t('SLIDESHOW_INTERVAL', 'Slideshow Interval (seconds)'), icon: 'slideshow', doc: t('SLIDESHOW_INTERVAL_DESC', 'Time between wallpaper transitions.'), min: 5, max: 120 },
      ],
    },
  ];
};

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

const SettingsSection = ({ section, values, onChange, onSave, saving, peppyFolders }) => {
  const isFieldVisible = (field) => {
    if (!field.visibleIf) return true;
    return values[field.visibleIf.field] === field.visibleIf.value;
  };

  // Resolve dynamic options for peppyMeterModel based on selected folder
  const resolveField = (field) => {
    if (field.dynamicOptionsFrom && peppyFolders?.length) {
      const selectedFolder = values[field.dynamicOptionsFrom];
      const folderData = peppyFolders.find((f) => f.folder === selectedFolder);
      const modelOptions = [{ value: 'random', label: 'Random (changes each track)' }];
      if (folderData) {
        for (const model of folderData.models) {
          modelOptions.push({ value: model, label: model });
        }
      }
      return { ...field, options: modelOptions };
    }
    return field;
  };

  return (
    <div className="settings-section">
      <div className="settings-section__header">
        <span className="material-icons settings-section__icon">{section.icon}</span>
        <h3 className="settings-section__title">{section.label}</h3>
      </div>
      <div className="settings-section__body">
        {section.fields.map((rawField) => {
          if (!isFieldVisible(rawField)) return null;
          const field = resolveField(rawField);
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
  peppyFolders: PropTypes.array,
};

/* ═══════════════════════════════════════════════════════════════════════
   Settings Page
   ═══════════════════════════════════════════════════════════════════════ */

const Settings = () => {
  useEffect(() => { document.title = 'Volumio - Stylish Player | Settings'; }, []);
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { data: pluginConfig, isLoading } = usePluginConfig();
  const { toasts, showToast } = useToast();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [peppyFolders, setPeppyFolders] = useState([]);
  const t = useSettingsTranslations();
  const sections = getSections(t, peppyFolders);
  const [activeTab, setActiveTab] = useState(sections[0].id);

  // Fetch peppy meter folders from the API
  useEffect(() => {
    axios.get(`${PLUGIN_BASE_URL}/api/peppy-folders`)
      .then(({ data }) => { if (Array.isArray(data)) setPeppyFolders(data); })
      .catch(() => { });
  }, []);

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

      // Resolve dynamic options (e.g. peppyMeterModel options depend on selected folder)
      let options = field.options || [];
      if (field.dynamicOptionsFrom && peppyFolders?.length) {
        const selectedFolder = values[field.dynamicOptionsFrom];
        const folderData = peppyFolders.find((f) => f.folder === selectedFolder);
        options = [{ value: 'random', label: 'Random' }];
        if (folderData) {
          for (const model of folderData.models) {
            options.push({ value: model, label: model });
          }
        }
      }

      if (field.element === 'select') {
        // Backend expects { value, label } for selects
        const opt = options.find((o) => o.value === val);
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
  }, [socket, values, showToast, peppyFolders]);

  if (isLoading) {
    return (
      <div className="settings-page d-flex align-items-center justify-content-center">
        <span className="material-icons spin">sync</span>
      </div>
    );
  }

  const activeSection = sections.find((s) => s.id === activeTab);

  return (
    <div className="settings-page">
      <div className="settings-topbar">
        <h2 className="settings-topbar__title">Settings</h2>
        <button className="btn btn-sm btn-primary settings-close-btn" onClick={() => navigate(-1)} aria-label="Close">
          <span className="material-icons">close</span>
        </button>
      </div>
      <div className="settings-tabs" role="tablist">
        {sections.map((section) => (
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
            peppyFolders={peppyFolders}
          />
        )}
      </div>
      <Toast toasts={toasts} />
    </div>
  );
};

export default Settings;
