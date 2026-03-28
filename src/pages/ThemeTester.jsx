import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import AnalogClock from '@/components/clocks/analog-clock';
import DigitalClock from '@/components/clocks/digital-clock';
import FlipClock from '@/components/clocks/flip-clock';
import Weather from '@/components/Weather';

const THEMES = [
  { value: 'metallic', label: 'Metallic' },
  { value: 'skeuomorphic', label: 'Skeuomorphic' },
  { value: 'aqua', label: 'Aqua' },
  { value: 'flat', label: 'Flat' },
  { value: 'win95', label: 'Windows 95' },
  { value: 'atv', label: 'Apple TV' },
];

const Section = ({ title, children }) => (
  <section className="mb-5">
    <h2
      className="mb-4"
      style={{ borderBottom: '1px solid var(--border-light, rgba(255,255,255,0.15))', paddingBottom: '0.5rem' }}
    >
      {title}
    </h2>
    {children}
  </section>
);

const ThemeTester = () => {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('tab1');

  return (
    <div
      className="container-fluid p-4"
      style={{ height: '100%', overflowY: 'auto', background: 'var(--bg-primary, #1a1a1a)', color: 'var(--text-primary, #fff)' }}
    >
      {/* ── Sticky Header ───────────────────────────────────── */}
      <div
        className="d-flex align-items-center gap-3 mb-5 py-3 sticky-top"
        style={{ background: 'var(--bg-primary, #1a1a1a)', borderBottom: '1px solid var(--border-light, rgba(255,255,255,0.15))', zIndex: 1000 }}
      >
        <h1 className="m-0 me-3" style={{ fontSize: '1.5rem' }}>Theme Tester</h1>
        <select
          className="form-select"
          style={{ maxWidth: 200 }}
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
        >
          {THEMES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Current: <strong>{theme}</strong></span>
      </div>

      {/* ── Buttons ─────────────────────────────────────────── */}
      <Section title="Buttons">
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className="btn">Default</button>
          <button className="btn btn-primary">Primary</button>
          <button className="btn btn-secondary">Secondary</button>
          <button className="btn btn-success">Success</button>
          <button className="btn btn-danger">Danger</button>
          <button className="btn btn-warning">Warning</button>
          <button className="btn btn-link">Link</button>
        </div>
        <div className="d-flex flex-wrap gap-2 mb-3">
          <button className="btn btn-sm">Small</button>
          <button className="btn btn-primary btn-sm">Primary SM</button>
          <button className="btn btn-lg">Large</button>
          <button className="btn btn-primary btn-lg">Primary LG</button>
        </div>
        <div className="d-flex flex-wrap gap-2">
          <button className="btn btn-outline-primary">Outline Primary</button>
          <button className="btn btn-outline-secondary">Outline Secondary</button>
          <button className="btn btn-primary" disabled>Disabled</button>
        </div>
      </Section>

      {/* ── Form Inputs ─────────────────────────────────────── */}
      <Section title="Form Inputs">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Text Input</label>
            <input type="text" className="form-control" placeholder="Enter text…" defaultValue="Sample text" />
          </div>
          <div className="col-md-4">
            <label className="form-label">Password</label>
            <input type="password" className="form-control" defaultValue="password123" />
          </div>
          <div className="col-md-4">
            <label className="form-label">Select</label>
            <select className="form-select">
              <option>Option 1</option>
              <option>Option 2</option>
              <option>Option 3</option>
            </select>
          </div>
          <div className="col-12">
            <label className="form-label">Textarea</label>
            <textarea className="form-control" rows={3} defaultValue="Multiline text content here…" />
          </div>
          <div className="col-12 d-flex flex-wrap gap-4 align-items-start pt-2">
            {/* Checkboxes */}
            <div>
              <div className="form-label mb-2">Checkboxes</div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="check1" defaultChecked />
                <label className="form-check-label" htmlFor="check1">Checked</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id="check2" />
                <label className="form-check-label" htmlFor="check2">Unchecked</label>
              </div>
            </div>
            {/* Radio */}
            <div>
              <div className="form-label mb-2">Radio</div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="tester-radio" id="radio1" defaultChecked />
                <label className="form-check-label" htmlFor="radio1">Option A</label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" name="tester-radio" id="radio2" />
                <label className="form-check-label" htmlFor="radio2">Option B</label>
              </div>
            </div>
            {/* Toggle */}
            <div>
              <div className="form-label mb-2">Toggle Switch</div>
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="toggle1" defaultChecked />
                <label className="form-check-label" htmlFor="toggle1">Enabled</label>
              </div>
              <div className="form-check form-switch">
                <input className="form-check-input" type="checkbox" id="toggle2" />
                <label className="form-check-label" htmlFor="toggle2">Disabled</label>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* ── Sliders ─────────────────────────────────────────── */}
      <Section title="Sliders">
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <label className="form-label">Range – 40%</label>
            <input type="range" className="form-range" defaultValue={40} />
          </div>
          <div className="col-md-6">
            <label className="form-label">Range – 75%</label>
            <input type="range" className="form-range" defaultValue={75} />
          </div>
        </div>
        <div className="form-label mb-3">Vertical Faders</div>
        <div className="d-flex gap-5 align-items-end">
          {[30, 55, 75, 90].map((pct) => (
            <div key={pct} className="d-flex flex-column align-items-center gap-2">
              <div className="slider-group">
                <div className="fader-track">
                  <div className="fader-cap" style={{ top: `${pct}%` }} />
                </div>
              </div>
              <small>{pct}%</small>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Progress Bars ────────────────────────────────────── */}
      <Section title="Progress Bars">
        <div className="d-flex flex-column gap-3">
          {[
            { label: 'Default 40%', value: 40, cls: '' },
            { label: 'Primary 60%', value: 60, cls: 'bg-primary' },
            { label: 'Success 80%', value: 80, cls: 'bg-success' },
            { label: 'Warning 55%', value: 55, cls: 'bg-warning' },
            { label: 'Danger 25%', value: 25, cls: 'bg-danger' },
          ].map(({ label, value, cls }) => (
            <div key={label}>
              <small className="form-label">{label}</small>
              <div className="progress">
                <div className={`progress-bar ${cls}`} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Knobs ────────────────────────────────────────────── */}
      <Section title="Knobs">
        <div className="d-flex gap-5 flex-wrap">
          {[
            { label: 'Volume', deg: -30 },
            { label: 'Bass', deg: 0 },
            { label: 'Treble', deg: 60 },
            { label: 'Balance', deg: 120 },
          ].map(({ label, deg }) => (
            <div key={label} className="knob-container">
              <div className="knob" style={{ transform: `rotate(${deg}deg)` }}>
                <div className="knob-track" />
              </div>
              <span className="form-label">{label}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Tabs ─────────────────────────────────────────────── */}
      <Section title="Tabs">
        <div className="mb-4">
          <div className="form-label mb-2">nav-tabs</div>
          <ul className="nav nav-tabs mb-3">
            {['tab1', 'tab2', 'tab3'].map((id, i) => (
              <li key={id} className="nav-item">
                <button
                  className={`nav-link ${activeTab === id ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  Tab {i + 1}
                </button>
              </li>
            ))}
          </ul>
          <div className="tab-content p-3" style={{ border: '1px solid var(--border-light, rgba(255,255,255,0.1))', borderRadius: 4 }}>
            {activeTab === 'tab1' && <span>Content for Tab 1</span>}
            {activeTab === 'tab2' && <span>Content for Tab 2</span>}
            {activeTab === 'tab3' && <span>Content for Tab 3</span>}
          </div>
        </div>
        <div>
          <div className="form-label mb-2">nav-pills</div>
          <ul className="nav nav-pills">
            {['tab1', 'tab2', 'tab3'].map((id, i) => (
              <li key={id} className="nav-item">
                <button
                  className={`nav-link ${activeTab === id ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                >
                  Pill {i + 1}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* ── Digital Clock ────────────────────────────────────── */}
      <Section title="Digital Clock">
        <DigitalClock showSeconds use12Hour showWeather={false} />
      </Section>

      {/* ── Analog Clock ─────────────────────────────────────── */}
      <Section title="Analog Clock">
        <AnalogClock showSeconds showDate showWeather={false} />
      </Section>

      {/* ── Flip Clock ───────────────────────────────────────── */}
      <Section title="Flip Clock">
        <FlipClock showSeconds showWeather={false} />
      </Section>

      {/* ── Weather – Current ────────────────────────────────── */}
      <Section title="Weather — Current">
        <Weather mode="current" showWind showHumidity showFeelsLike showSunrise showSunset />
      </Section>

      {/* ── Weather – Hourly ─────────────────────────────────── */}
      <Section title="Weather — Hourly">
        <Weather mode="hourly" showWind hours={12} />
      </Section>

      {/* ── Weather – Daily ──────────────────────────────────── */}
      <Section title="Weather — Daily">
        <Weather mode="daily" showWind showSunrise showSunset showPrecip days={7} />
      </Section>

      {/* ── Weather – Full ───────────────────────────────────── */}
      <Section title="Weather — Full">
        <Weather mode="full" />
      </Section>
    </div>
  );
};

export default ThemeTester;
