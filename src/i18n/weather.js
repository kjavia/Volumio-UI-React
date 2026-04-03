import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ── Weather namespace ─────────────────────────────────────────────────────────
import enWeather from './locales/en/weather.json';
import deWeather from './locales/de/weather.json';
import frWeather from './locales/fr/weather.json';
import esWeather from './locales/es/weather.json';
import itWeather from './locales/it/weather.json';
import ptWeather from './locales/pt/weather.json';
import nlWeather from './locales/nl/weather.json';
import ruWeather from './locales/ru/weather.json';
import jaWeather from './locales/ja/weather.json';
import koWeather from './locales/ko/weather.json';
import zhCNWeather from './locales/zh-CN/weather.json';
import zhTWWeather from './locales/zh-TW/weather.json';
import plWeather from './locales/pl/weather.json';
import csWeather from './locales/cs/weather.json';
import skWeather from './locales/sk/weather.json';
import huWeather from './locales/hu/weather.json';
import elWeather from './locales/el/weather.json';
import trWeather from './locales/tr/weather.json';
import ukWeather from './locales/uk/weather.json';
import svWeather from './locales/sv/weather.json';
import noWeather from './locales/no/weather.json';
import daWeather from './locales/da/weather.json';
import fiWeather from './locales/fi/weather.json';
import thWeather from './locales/th/weather.json';
import viWeather from './locales/vi/weather.json';

i18n.use(initReactI18next).init({
  resources: {
    en:      { weather: enWeather },
    de:      { weather: deWeather },
    fr:      { weather: frWeather },
    es:      { weather: esWeather },
    it:      { weather: itWeather },
    pt:      { weather: ptWeather },
    nl:      { weather: nlWeather },
    ru:      { weather: ruWeather },
    ja:      { weather: jaWeather },
    ko:      { weather: koWeather },
    'zh-CN': { weather: zhCNWeather },
    'zh-TW': { weather: zhTWWeather },
    pl:      { weather: plWeather },
    cs:      { weather: csWeather },
    sk:      { weather: skWeather },
    hu:      { weather: huWeather },
    el:      { weather: elWeather },
    tr:      { weather: trWeather },
    uk:      { weather: ukWeather },
    sv:      { weather: svWeather },
    no:      { weather: noWeather },
    da:      { weather: daWeather },
    fi:      { weather: fiWeather },
    th:      { weather: thWeather },
    vi:      { weather: viWeather },
  },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['weather'],
  defaultNS: 'weather',
  interpolation: { escapeValue: false },
});

export default i18n;
