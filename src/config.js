// Central configuration for the Stylish Player app.
//
// In development, host and plugin port come from environment variables
// (set VITE_DEV_HOST and VITE_DEV_PLUGIN_PORT in .env or .env.local).
//
// In production, the app is served by the plugin's own HTTP server so:
//   VOLUMIO_HOST  = window.location.hostname  (the device's IP / hostname)
//   PLUGIN_PORT   = window.location.port      (the port the plugin is running on)

// Use a runtime check for the dev server to avoid issues with
// Vite statically replacing import.meta.env.DEV during build if misconfigured
const isDev = import.meta.env.DEV || window.location.port === '5173';

const VOLUMIO_HOST = isDev
  ? (import.meta.env.VITE_DEV_HOST || window.location.hostname)
  : window.location.hostname;
const defaultPluginPort = 3339;
const PLUGIN_PORT = isDev
  ? (Number(import.meta.env.VITE_DEV_PLUGIN_PORT) || defaultPluginPort)
  : (Number(window.location.port) || defaultPluginPort);

const VOLUMIO_API_PORT = 3000;
const SPECTRUM_STREAM_PORT = 8000;

const VOLUMIO_BASE_URL = `http://${VOLUMIO_HOST}:${VOLUMIO_API_PORT}`;
// Use relative path in production to handle dynamic ports automatically
const PLUGIN_BASE_URL = isDev ? `http://${VOLUMIO_HOST}:${PLUGIN_PORT}` : '';
const SPECTRUM_STREAM_URL = `http://${VOLUMIO_HOST}:${SPECTRUM_STREAM_PORT}`;

export {
  VOLUMIO_HOST,
  VOLUMIO_API_PORT,
  PLUGIN_PORT,
  SPECTRUM_STREAM_PORT,
  VOLUMIO_BASE_URL,
  PLUGIN_BASE_URL,
  SPECTRUM_STREAM_URL,
};

