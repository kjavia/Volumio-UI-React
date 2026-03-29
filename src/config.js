// Central configuration for the Stylish Player app.
//
// In development, host and plugin port come from environment variables
// (set VITE_DEV_HOST and VITE_DEV_PLUGIN_PORT in .env or .env.local).
//
// In production, the app is served by the plugin's own HTTP server so:
//   VOLUMIO_HOST  = window.location.hostname  (the device's IP / hostname)
//   PLUGIN_PORT   = window.location.port      (the port the plugin is running on)
//
// IMPORTANT: use import.meta.env.DEV directly (do NOT combine with runtime checks).
// Vite replaces it with a literal true/false at build time, which lets Rollup
// fully tree-shake the dead branch so no hardcoded dev IP or port leaks into
// the production bundle.

const VOLUMIO_HOST = import.meta.env.DEV
  ? import.meta.env.VITE_DEV_HOST
  : window.location.hostname;

const PLUGIN_PORT = import.meta.env.DEV
  ? Number(import.meta.env.VITE_DEV_PLUGIN_PORT)
  : Number(window.location.port);

const VOLUMIO_API_PORT = 3000;
const SPECTRUM_STREAM_PORT = 8000;

const VOLUMIO_BASE_URL = `http://${VOLUMIO_HOST}:${VOLUMIO_API_PORT}`;
// Empty string = relative URL in production, so requests use whatever
// host:port the page was served on — no hardcoded port needed.
const PLUGIN_BASE_URL = import.meta.env.DEV ? `http://${VOLUMIO_HOST}:${PLUGIN_PORT}` : '';
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

