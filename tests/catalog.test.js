const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { safeScriptJson } = require('../src/utils/safeJson');
const { formatPrice, buildProductWhatsAppMessage } = require('../src/utils/storefrontFormat');

describe('storefrontFormat', () => {
  it('formatea precios en COP', () => {
    assert.match(formatPrice(45000), /\$45\.000|\$45,000/);
  });

  it('arma mensaje de WhatsApp para un producto', () => {
    const msg = buildProductWhatsAppMessage({ sku: 'OP-1', name: 'Aro', price: 1000, images: [] });
    assert.match(msg, /OP-1/);
    assert.match(msg, /Aro/);
  });
});

describe('safeScriptJson', () => {
  it('serializa objetos válidos para script inline', () => {
    const json = safeScriptJson({ categories: [], productCount: 3 });
    assert.equal(json, '{"categories":[],"productCount":3}');
    assert.doesNotThrow(() => JSON.parse(json));
  });

  it('escapa caracteres peligrosos en HTML/script', () => {
    const json = safeScriptJson({ name: '<script>alert(1)</script>' });
    assert.ok(!json.includes('<script>'));
    assert.ok(json.includes('\\u003c'));
  });
});

describe('catalogController (contrato)', () => {
  it('getCatalog exporta handler async', () => {
    const catalogController = require('../src/controllers/catalogController');
    assert.equal(typeof catalogController.getCatalog, 'function');
    assert.equal(catalogController.getCatalog.length, 3);
  });
});

describe('homeController (contrato)', () => {
  it('renderHome exporta handler async', () => {
    const homeController = require('../src/controllers/homeController');
    assert.equal(typeof homeController.renderHome, 'function');
    assert.equal(homeController.renderHome.length, 3);
  });
});
