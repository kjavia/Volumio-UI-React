import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PLUGIN_BASE_URL } from '@/config';
import { useSocket } from '@/contexts/SocketContext';
import usePluginConfig from '@/hooks/usePluginConfig';
import useToast from '@/hooks/useToast';
import Toast from '@/components/Toast';
import SettingsExportImport from '@/components/SettingsExportImport';
import SettingsSection from '@/components/settings/SettingsSection';
import getSections from '@/config/settingsSections';
import usePluginTranslations from '@/hooks/usePluginTranslations';
import './settings.scss';

const PLUGIN_ENDPOINT = 'user_interface/stylish_player';

/* ─── Translation hook — fetches i18n strings from REST API ────────────── */
// Extracted to `src/hooks/usePluginTranslations.js` so other pages (e.g.
// LayoutDesigner) can reuse the same label vocabulary.

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
  const [peppySpectrumFolders, setPeppySpectrumFolders] = useState([]);
  const t = usePluginTranslations();
  const sections = getSections(t, peppyFolders, peppySpectrumFolders);
  const [activeTab, setActiveTab] = useState(sections[0].id);
  const effectiveValues = useMemo(
    () => (Object.keys(values).length > 0 ? values : (pluginConfig || {})),
    [values, pluginConfig],
  );

  // Fetch peppy meter and spectrum folders from the API
  useEffect(() => {
    axios.get(`${PLUGIN_BASE_URL}/api/peppy-folders`)
      .then(({ data }) => { if (Array.isArray(data)) setPeppyFolders(data); })
      .catch(() => { });
    axios.get(`${PLUGIN_BASE_URL}/api/peppy-spectrum-folders`)
      .then(({ data }) => { if (Array.isArray(data)) setPeppySpectrumFolders(data); })
      .catch(() => { });
  }, []);

  // Re-fetch folder lists after a pack upload
  const handlePackUploaded = useCallback(() => {
    axios.get(`${PLUGIN_BASE_URL}/api/peppy-folders`)
      .then(({ data }) => { if (Array.isArray(data)) setPeppyFolders(data); })
      .catch(() => { });
    axios.get(`${PLUGIN_BASE_URL}/api/peppy-spectrum-folders`)
      .then(({ data }) => { if (Array.isArray(data)) setPeppySpectrumFolders(data); })
      .catch(() => { });
  }, []);

  const handleChange = useCallback((id, val) => {
    setValues((prev) => {
      const base = Object.keys(prev).length > 0 ? prev : effectiveValues;
      return { ...base, [id]: val };
    });
  }, [effectiveValues]);

  const buildSectionData = useCallback((section, sourceValues) => {
    const data = {};

    for (const field of section.fields) {
      const rawVal = sourceValues[field.id];

      // Resolve dynamic options (e.g. peppyMeterModel options depend on selected folder)
      let options = field.options || [];
      if (field.dynamicOptionsFrom) {
        const selectedFolder = sourceValues[field.dynamicOptionsFrom];
        const sourceFolders = field.dynamicOptionsFrom === 'peppySpectrumFolder'
          ? (peppySpectrumFolders || [])
          : (peppyFolders || []);
        const folderData = sourceFolders.find((f) => f.folder === selectedFolder);
        options = [{ value: 'random', label: 'Random' }];
        if (folderData) {
          for (const model of folderData.models) {
            const m = typeof model === 'string' ? { name: model } : model;
            options.push({ value: m.name, label: m.name });
          }
        }
      }

      if (field.element === 'select') {
        // Imported settings may contain either the raw value or { value, label } shape
        const selectedValue = typeof rawVal === 'object' && rawVal !== null ? rawVal.value : rawVal;
        const opt = options.find((o) => o.value === selectedValue);
        data[field.id] = opt || { value: selectedValue, label: rawVal?.label || selectedValue };
      } else if (field.element === 'fontrow') {
        data[field.nameId] = sourceValues[field.nameId] ?? '';
        data[field.sizeId] = sourceValues[field.sizeId] ?? '';
      } else {
        data[field.id] = rawVal ?? '';
      }
    }

    return data;
  }, [peppyFolders, peppySpectrumFolders]);

  const handleSave = useCallback((section) => {
    if (!socket) return;
    setSaving(true);

    const data = buildSectionData(section, effectiveValues);

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
  }, [socket, effectiveValues, showToast, buildSectionData]);

  /**
   * Handle importing of settings and layouts from JSON file
   */
  const handleImportSettings = useCallback((importedSettings, importedLayouts, error) => {
    if (error) {
      showToast(error, 'error');
      return;
    }

    if (!importedSettings) return;

    if (!socket) {
      showToast('Socket connection not available', 'error');
      return;
    }

    try {
      const mergedValues = { ...effectiveValues, ...importedSettings };
      setValues(mergedValues);
      setSaving(true);

      sections.forEach((section) => {
        const data = buildSectionData(section, mergedValues);
        socket.emit('callMethod', {
          endpoint: PLUGIN_ENDPOINT,
          method: section.method,
          data,
        });
      });

      // Save layouts if provided
      if (importedLayouts && Array.isArray(importedLayouts)) {
        socket.emit('callMethod', {
          endpoint: PLUGIN_ENDPOINT,
          method: 'configSaveLayoutDesigner',
          data: { layoutDesigner: JSON.stringify({ layouts: importedLayouts }) },
        });
      }

      setTimeout(() => {
        setSaving(false);
        showToast('Settings and layouts imported successfully.', 'success');
      }, 1500);
    } catch (err) {
      showToast(`Failed to import settings: ${err.message}`, 'error');
      setSaving(false);
    }
  }, [socket, effectiveValues, sections, showToast, buildSectionData]);

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
      <div className="settings-topbar d-flex align-items-center justify-content-between">
        <div>
          <h2 className="settings-topbar__title">Settings</h2>
        </div>
        <div className="settings-topbar__actions d-flex gap-2 align-items-center">
          <SettingsExportImport
            currentSettings={effectiveValues}
            currentLayouts={pluginConfig?.layoutDesigner?.layouts}
            onImport={handleImportSettings}
            t={t}
          />
          <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/layout-designer')}>
            <span className="material-icons">grid_view</span>
            Layout Designer
          </button>
          <button className="btn btn-sm btn-primary settings-close-btn" onClick={() => navigate(-1)} aria-label="Close">
            <span className="material-icons">close</span>
          </button>
        </div>
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
            values={effectiveValues}
            onChange={handleChange}
            onSave={handleSave}
            saving={saving}
            peppyFolders={peppyFolders}
            peppySpectrumFolders={peppySpectrumFolders}
            onPackUploaded={handlePackUploaded}
            t={t}
          />
        )}
      </div>
      <Toast toasts={toasts} />
    </div>
  );
};

export default Settings;
