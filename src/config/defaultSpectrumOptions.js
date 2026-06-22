/**
 * AudioMotion-Analyzer default options for the main spectrum visualizer
 * (large screen / tablet / desktop player). Users can override any subset
 * of these via the "Spectrum Options (JSON)" field in plugin settings;
 * keys absent from the user JSON fall back to the values defined here.
 *
 * Note: `gradient` and `mode` are not included here — they are sourced
 * from component props/state in SpectrumAnalyzer.jsx and merged in
 * alongside these defaults.
 */
const defaultSpectrumOptions = {
  alphaBars: false,
  ansiBands: true,
  barSpace: 0.5,
  bgAlpha: 0.7,
  channelLayout: 'single',
  colorMode: 'gradient',
  fadePeaks: false,
  fftSize: 8192,
  fillAlpha: 1,
  frequencyScale: 'log',
  gravity: 3.8,
  ledBars: true,
  linearAmplitude: false,
  linearBoost: 1,
  lineWidth: 0,
  loRes: false,
  lumiBars: false,
  maxDecibels: -25,
  maxFPS: 0,
  maxFreq: 20000,
  minDecibels: -85,
  minFreq: 25,
  mirror: 0,
  noteLabels: false,
  outlineBars: false,
  overlay: true,
  peakFadeTime: 750,
  peakHoldTime: 500,
  peakLine: false,
  radial: false,
  radialInvert: false,
  radius: 0.3,
  reflexAlpha: 0.15,
  reflexBright: 1,
  reflexFit: true,
  reflexRatio: 0,
  roundBars: false,
  showBgColor: false,
  showFPS: false,
  showPeaks: true,
  showScaleX: false,
  showScaleY: false,
  smoothing: 0.5,
  spinSpeed: 0,
  splitGradient: false,
  trueLeds: true,
  useCanvas: true,
  volume: 1,
  weightingFilter: '',
};

export default defaultSpectrumOptions;
