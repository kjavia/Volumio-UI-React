// Central configuration for the Stylish Player app.
// Since the app is served by the Volumio plugin on the device itself,
// we derive the device host from window.location.hostname.

const VOLUMIO_HOST = '192.168.0.132';
const VOLUMIO_API_PORT = 3000;
const PLUGIN_PORT = 3339;
const SPECTRUM_STREAM_PORT = 8000;

const VOLUMIO_BASE_URL = `http://${VOLUMIO_HOST}:${VOLUMIO_API_PORT}`;
const PLUGIN_BASE_URL = `http://${VOLUMIO_HOST}:${PLUGIN_PORT}`;
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
