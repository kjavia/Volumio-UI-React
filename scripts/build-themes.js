#!/usr/bin/env node
/**
 * build-themes.js
 * Compile all SCSS themes to public/themes/*.css via sass.
 *
 * Usage:
 *   node scripts/build-themes.js          # one-shot build
 *   node scripts/build-themes.js --watch  # watch mode
 */

import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// ─── Theme list ───────────────────────────────────────────────────────────
// Add new themes here — one entry per theme.
const THEMES = [
  'metallic',
  'skeuomorphic',
  'aqua',
  'flat',
  'win95',
  'casio',
];
// ─────────────────────────────────────────────────────────────────────────

const watch = process.argv.includes('--watch');

const pairs = THEMES.map(
  (t) => `design-system/themes/${t}/index.scss:public/themes/${t}.css`
).join(' ');

const cmd = [
  'sass',
  '--load-path=node_modules',
  watch ? '--watch' : '',
  pairs,
].filter(Boolean).join(' ');

console.log(`[build-themes] ${watch ? 'watching' : 'building'} ${THEMES.length} theme(s)…`);
execSync(cmd, { cwd: root, stdio: 'inherit' });
