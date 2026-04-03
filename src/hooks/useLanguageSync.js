import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import usePluginConfig from './usePluginConfig';

// Volumio langue_code uses underscores (zh_CN) while BCP 47 uses hyphens (zh-CN).
const normalizeLanguage = (code) => (code || 'en').replace('_', '-');

/**
 * Keeps the i18next active language in sync with the Volumio system language
 * stored in the plugin config. Call this once near the top of the Weather tree.
 */
const useLanguageSync = () => {
  const { data: config } = usePluginConfig();
  const { i18n } = useTranslation();

  useEffect(() => {
    if (!config?.language) return;
    const lang = normalizeLanguage(config.language);
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang);
    }
  }, [config?.language, i18n]);
};

export default useLanguageSync;
