const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { validateStorefrontOrder } = require('../src/validations/pedido.validation');

describe('validateStorefrontOrder', () => {
  const validBody = {
    cliente_nombre: 'Ana',
    cliente_apellido: 'García',
    cliente_direccion: 'Calle 1 #2-3, Bogotá',
    cliente_telefono: '3001234567',
    origen: 'carrito',
    items: [{ sku: 'OP-001', cantidad: 2 }],
  };

  it('acepta un pedido válido con sku', () => {
    const result = validateStorefrontOrder(validBody);
    assert.equal(result.isValid, true);
    assert.equal(result.origen, 'carrito');
    assert.equal(result.rawItems.length, 1);
  });

  it('rechaza pedido sin teléfono', () => {
    const result = validateStorefrontOrder({ ...validBody, cliente_telefono: '' });
    assert.equal(result.isValid, false);
    assert.ok(result.errors.cliente_telefono);
  });

  it('rechaza origen inválido', () => {
    const result = validateStorefrontOrder({ ...validBody, origen: 'otro' });
    assert.equal(result.isValid, false);
    assert.ok(result.errors.origen);
  });
});
