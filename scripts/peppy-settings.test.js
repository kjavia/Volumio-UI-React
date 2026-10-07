import assert from 'node:assert/strict';
import test from 'node:test';
import getSections from '../src/config/settingsSections.js';
import { getSmoothedLevel, getMeterLevel } from '../src/components/peppy-meter/meterLevels.js';

test('Peppy section owns all pack selectors and the response controls', () => {
  const sections = getSections((key, fallback) => fallback,
    [{ folder: 'pack', name: 'Pack', width: 1280, height: 400 }],
    [{ folder: 'spectrum', name: 'Spectrum', width: 800, height: 200, bars: 32 }]);
  const peppy = sections.find((section) => section.id === 'section_peppy');
  assert.equal(peppy.label, 'Peppy');
  assert.equal(peppy.method, 'configSavePeppy');
  assert.deepEqual(peppy.fields.map((field) => field.id), [
    'peppyMeterFolder', 'peppyMeterModel', 'peppyNeedleSensitivity',
    'peppySmoothness', 'peppySpectrumFolder', 'peppySpectrumModel',
  ]);
  assert.ok(peppy.fields.every((field) => !field.visibleIf));
  assert.equal(peppy.fields[0].options[0].value, 'pack');
  assert.equal(peppy.fields[4].options[0].value, 'spectrum');
  assert.equal(peppy.fields[1].dynamicOptionsFrom, 'peppyMeterFolder');
  assert.equal(peppy.fields[5].dynamicOptionsFrom, 'peppySpectrumFolder');
  assert.ok(!sections.find((section) => section.id === 'section_player_config')
    .fields.some((field) => field.id.startsWith('peppy')));
});

test('control limits match server validation', () => {
  const fields = getSections((key, fallback) => fallback).find((section) => section.id === 'section_peppy').fields;
  const sensitivity = fields.find((field) => field.id === 'peppyNeedleSensitivity');
  const smoothness = fields.find((field) => field.id === 'peppySmoothness');
  assert.equal(sensitivity.min, 0.1);
  assert.equal(sensitivity.max, 5);
  assert.equal(sensitivity.step, 0.1);
  assert.equal(smoothness.min, 1);
  assert.equal(smoothness.max, 30);
});

test('default smoothing and sensitivity reproduce the previous response', () => {
  const samples = [0.1, 0.3, 0.7, 0.9, 0.5, 0.6, 0.8, 0.2];
  const buffer = [];
  for (let i = 0; i < samples.length; i++) {
    const window = samples.slice(Math.max(0, i - 5), i + 1);
    const expected = window.reduce((sum, sample) => sum + sample, 0) / window.length * 0.5;
    assert.equal(getMeterLevel(getSmoothedLevel(buffer, samples[i], 6), 0.5), expected);
  }
  assert.equal(buffer.length, 6);
});

test('smoothing uses exactly the requested window, including when reduced', () => {
  for (const size of [1, 6, 30]) {
    const buffer = [];
    for (let i = 0; i < size; i++) getSmoothedLevel(buffer, 0, size);
    assert.equal(getSmoothedLevel(buffer, 1, size), 1 / size);
    assert.equal(buffer.length, size);
  }
  const buffer = [0, 0, 0, 0, 0, 0];
  assert.equal(getSmoothedLevel(buffer, 0.8, 1), 0.8);
  assert.deepEqual(buffer, [0.8]);
});

test('sensitivity scales both low and high input levels and caps output', () => {
  assert.equal(getMeterLevel(0.4, 0.1), 0.4 * 0.1);
  assert.equal(getMeterLevel(0.4, 0.5), 0.2);
  assert.equal(getMeterLevel(0.4, 2), 0.8);
  assert.equal(getMeterLevel(0.4, 5), 1);
  assert.equal(getMeterLevel(0, 5), 0);
});
