import { useRef } from 'react';

/**
 * SettingsExportImport Component
 * Handles exporting and importing complete plugin settings including layouts
 */
const SettingsExportImport = ({ currentSettings, currentLayouts, onImport, t }) => {
  const fileRef = useRef(null);

  /**
   * Export all settings and layouts to a JSON file
   */
  const handleExportSettings = () => {
    // Keep layouts only at the root-level `layouts` key in export JSON.
    const { ...settingsWithoutLayouts } = currentSettings || {};

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      settings: settingsWithoutLayouts,
      layouts: currentLayouts || [],
    };

    const blob = new Blob(
      [JSON.stringify(exportData, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stylish-player-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /**
   * Handle import of settings and layouts from a JSON file
   */
  const handleImportSettings = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset so the same file can be re-imported if needed
    e.target.value = '';

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);

        // Validate the import file structure
        if (!parsed.settings || typeof parsed.settings !== 'object') {
          throw new Error('Invalid settings file — missing "settings" object.');
        }

        const rootLayouts = Array.isArray(parsed.layouts) ? parsed.layouts : null;
        const nestedLayouts = Array.isArray(parsed.settings?.layoutDesigner?.layouts)
          ? parsed.settings.layoutDesigner.layouts
          : null;

        if (!rootLayouts && !nestedLayouts) {
          throw new Error('Invalid settings file — missing "layouts" array.');
        }

        // Prefer root-level layouts (new format), fallback to nested (legacy format).
        const layouts = rootLayouts || nestedLayouts;
        const { ...settings } = parsed.settings;

        if (onImport) {
          onImport(settings, layouts);
        }
      } catch (err) {
        const errMsg = err.message || 'Failed to parse the JSON file.';
        if (onImport) {
          onImport(null, null, errMsg);
        }
      }
    };

    reader.readAsText(file);
  };

  /**
   * Trigger the file picker
   */
  const handleImportClick = () => {
    fileRef.current?.click();
  };

  return (
    <>
      <button
        className="btn btn-sm btn-outline-primary"
        onClick={handleExportSettings}
        title={t('EXPORT_SETTINGS_TOOLTIP', 'Export all settings and layouts to a JSON file')}
      >
        <span className="material-icons">download</span>
        {t('EXPORT_SETTINGS', 'Export Settings')}
      </button>

      <button
        className="btn btn-sm btn-outline-primary"
        onClick={handleImportClick}
        title={t('IMPORT_SETTINGS_TOOLTIP', 'Import settings and layouts from a JSON file')}
      >
        <span className="material-icons">upload</span>
        {t('IMPORT_SETTINGS', 'Import Settings')}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        onChange={handleImportSettings}
        style={{ display: 'none' }}
      />
    </>
  );
};


export default SettingsExportImport;
