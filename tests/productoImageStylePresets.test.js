const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { STYLE_PRESETS } = require('../src/utils/productoImageStylePresets');

describe('productoImageStylePresets', () => {
  it('incluye presets de catálogo conocidos', () => {
    assert.ok(STYLE_PRESETS['minimal-white']);
    assert.ok(STYLE_PRESETS['gold-oasis']);
    assert.equal(STYLE_PRESETS['gold-oasis'].background, 'grad-gold');
  });
});
