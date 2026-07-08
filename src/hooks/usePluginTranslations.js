import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PLUGIN_BASE_URL } from '@/config';

/**
 * Fetches the plugin's i18n string map from its REST endpoint and returns
 * a `t(key, fallback)` helper that mirrors the pattern used across the
 * Settings screen. Reused wherever we want to display labels defined in
 * the plugin's translation files (config.json / UIConfig field labels).
 */
export default function usePluginTranslations() {
  const [strings, setStrings] = useState({});

  useEffect(() => {
    axios.get(`${PLUGIN_BASE_URL}/api/translations`)
      .then(({ data }) => { if (data && typeof data === 'object') setStrings(data); })
      .catch(() => { });
  }, []);

  return useCallback((key, fallback) => strings[key] || fallback || key, [strings]);
}
