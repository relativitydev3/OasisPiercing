/** Presets de estilo para el editor de imagen de producto (admin). */
const STYLE_PRESETS = {
  'minimal-white': {
    background: 'white',
    brightness: 2,
    contrast: 4,
    padding: 24,
    dropShadow: 0,
    vignette: 0,
    fitMode: 'contain',
  },
  'gold-oasis': {
    background: 'grad-gold',
    brightness: 4,
    contrast: 6,
    saturation: 8,
    padding: 32,
    dropShadow: 35,
    vignette: 12,
    fitMode: 'contain',
  },
  'dark-premium': {
    background: 'grad-dark',
    brightness: 6,
    contrast: 10,
    saturation: -5,
    padding: 40,
    dropShadow: 55,
    vignette: 28,
    fitMode: 'contain',
  },
  'soft-float': {
    background: 'cream',
    brightness: 3,
    padding: 48,
    dropShadow: 45,
    bgBlur: 12,
    fitMode: 'contain',
  },
};

module.exports = { STYLE_PRESETS };
