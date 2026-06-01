import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// ── Weather namespace ─────────────────────────────────────────────────────────
import enWeather from './locales/en/weather.json';

// ── Layout Designer namespace ─────────────────────────────────────────────────
import enLayoutDesigner from './locales/en/layoutDesigner.json';
import deLayoutDesigner from './locales/de/layoutDesigner.json';
import frLayoutDesigner from './locales/fr/layoutDesigner.json';
import esLayoutDesigner from './locales/es/layoutDesigner.json';
import itLayoutDesigner from './locales/it/layoutDesigner.json';
import ptLayoutDesigner from './locales/pt/layoutDesigner.json';
import nlLayoutDesigner from './locales/nl/layoutDesigner.json';
import ruLayoutDesigner from './locales/ru/layoutDesigner.json';
import jaLayoutDesigner from './locales/ja/layoutDesigner.json';
import koLayoutDesigner from './locales/ko/layoutDesigner.json';
import zhCNLayoutDesigner from './locales/zh-CN/layoutDesigner.json';
import zhTWLayoutDesigner from './locales/zh-TW/layoutDesigner.json';
import plLayoutDesigner from './locales/pl/layoutDesigner.json';
import csLayoutDesigner from './locales/cs/layoutDesigner.json';
import skLayoutDesigner from './locales/sk/layoutDesigner.json';
import huLayoutDesigner from './locales/hu/layoutDesigner.json';
import elLayoutDesigner from './locales/el/layoutDesigner.json';
import trLayoutDesigner from './locales/tr/layoutDesigner.json';
import ukLayoutDesigner from './locales/uk/layoutDesigner.json';
import svLayoutDesigner from './locales/sv/layoutDesigner.json';
import noLayoutDesigner from './locales/no/layoutDesigner.json';
import daLayoutDesigner from './locales/da/layoutDesigner.json';
import fiLayoutDesigner from './locales/fi/layoutDesigner.json';
import thLayoutDesigner from './locales/th/layoutDesigner.json';
import viLayoutDesigner from './locales/vi/layoutDesigner.json';
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
    en:      { weather: enWeather, layoutDesigner: enLayoutDesigner },
    de:      { weather: deWeather, layoutDesigner: deLayoutDesigner },
    fr:      { weather: frWeather, layoutDesigner: frLayoutDesigner },
    es:      { weather: esWeather, layoutDesigner: esLayoutDesigner },
    it:      { weather: itWeather, layoutDesigner: itLayoutDesigner },
    pt:      { weather: ptWeather, layoutDesigner: ptLayoutDesigner },
    nl:      { weather: nlWeather, layoutDesigner: nlLayoutDesigner },
    ru:      { weather: ruWeather, layoutDesigner: ruLayoutDesigner },
    ja:      { weather: jaWeather, layoutDesigner: jaLayoutDesigner },
    ko:      { weather: koWeather, layoutDesigner: koLayoutDesigner },
    'zh-CN': { weather: zhCNWeather, layoutDesigner: zhCNLayoutDesigner },
    'zh-TW': { weather: zhTWWeather, layoutDesigner: zhTWLayoutDesigner },
    pl:      { weather: plWeather, layoutDesigner: plLayoutDesigner },
    cs:      { weather: csWeather, layoutDesigner: csLayoutDesigner },
    sk:      { weather: skWeather, layoutDesigner: skLayoutDesigner },
    hu:      { weather: huWeather, layoutDesigner: huLayoutDesigner },
    el:      { weather: elWeather, layoutDesigner: elLayoutDesigner },
    tr:      { weather: trWeather, layoutDesigner: trLayoutDesigner },
    uk:      { weather: ukWeather, layoutDesigner: ukLayoutDesigner },
    sv:      { weather: svWeather, layoutDesigner: svLayoutDesigner },
    no:      { weather: noWeather, layoutDesigner: noLayoutDesigner },
    da:      { weather: daWeather, layoutDesigner: daLayoutDesigner },
    fi:      { weather: fiWeather, layoutDesigner: fiLayoutDesigner },
    th:      { weather: thWeather, layoutDesigner: thLayoutDesigner },
    vi:      { weather: viWeather, layoutDesigner: viLayoutDesigner },
  },
  lng: 'en',
  fallbackLng: 'en',
  ns: ['weather', 'layoutDesigner'],
  defaultNS: 'weather',
  interpolation: { escapeValue: false },
});

export default i18n;
