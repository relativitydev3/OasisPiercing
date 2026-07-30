const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  buildDuplicateNombre,
  generateDuplicateCodigo,
} = require('../src/utils/productoDuplicate');

describe('productoDuplicate', () => {
  it('buildDuplicateNombre añade sufijo (copia)', () => {
    assert.equal(buildDuplicateNombre('Aro titanio'), 'Aro titanio (copia)');
  });

  it('buildDuplicateNombre no duplica el sufijo', () => {
    assert.equal(buildDuplicateNombre('Aro (copia)'), 'Aro (copia)');
  });

  it('buildDuplicateNombre maneja nombre vacío', () => {
    assert.equal(buildDuplicateNombre(''), 'Copia de producto');
  });

  it('generateDuplicateCodigo usa CODIGO-copia si está libre', async () => {
    const codigo = await generateDuplicateCodigo('LAB-001', async () => false);
    assert.equal(codigo, 'LAB-001-copia');
  });

  it('generateDuplicateCodigo incrementa si CODIGO-copia existe', async () => {
    const taken = new Set(['LAB-001-copia']);
    const codigo = await generateDuplicateCodigo('LAB-001', async (c) => taken.has(c));
    assert.equal(codigo, 'LAB-001-copia-2');
  });

  it('generateDuplicateCodigo lanza error si no hay código disponible', async () => {
    await assert.rejects(
      () => generateDuplicateCodigo('X', async () => true),
      /código único/
    );
  });
});

describe('adminProductoController (contrato)', () => {
  it('exporta show, duplicate y showEdit', () => {
    const ctrl = require('../src/controllers/adminProductoController');
    assert.equal(typeof ctrl.show, 'function');
    assert.equal(typeof ctrl.duplicate, 'function');
    assert.equal(typeof ctrl.showEdit, 'function');
  });
});

describe('ProductoService.duplicate (contrato)', () => {
  it('expone método duplicate', () => {
    const ProductoService = require('../src/services/productoService');
    assert.equal(typeof ProductoService.duplicate, 'function');
  });
});
