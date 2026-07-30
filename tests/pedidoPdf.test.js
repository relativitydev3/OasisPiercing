const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  formatCop,
  formatPedidoDate,
  safeFilename,
  buildPedidoPdf,
} = require('../src/utils/pedidoPdf');

const samplePedido = {
  numero_pedido: 'OP-20250729-1234',
  cliente_nombre: 'María',
  cliente_apellido: 'García',
  cliente_direccion: 'Calle 10 # 20-30, Medellín',
  estado: 'confirmado',
  total: 125000,
  notas: 'Entregar en la tarde.',
  created_at: '2026-07-29T15:30:00.000Z',
  items: [
    {
      producto_nombre: 'Labret titanio',
      producto_codigo: 'LAB-001',
      cantidad: 2,
      precio_unitario: 45000,
      subtotal: 90000,
    },
    {
      producto_nombre: 'Aro hélix',
      producto_codigo: 'HEL-002',
      cantidad: 1,
      precio_unitario: 35000,
      subtotal: 35000,
    },
  ],
};

describe('pedidoPdf', () => {
  it('formatCop formatea pesos colombianos', () => {
    assert.equal(formatCop(125000), '$125.000');
  });

  it('safeFilename sanitiza el número de pedido', () => {
    assert.equal(safeFilename('OP-20250729-1234'), 'pedido-OP-20250729-1234.pdf');
  });

  it('buildPedidoPdf genera un buffer PDF válido', async () => {
    const buffer = await buildPedidoPdf(samplePedido, null);
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 500);
    assert.equal(buffer.subarray(0, 4).toString(), '%PDF');
  });

  it('formatPedidoDate devuelve texto legible', () => {
    const text = formatPedidoDate('2026-07-29T15:30:00.000Z');
    assert.match(text, /2026/);
  });
});

describe('adminPedidoController (contrato PDF)', () => {
  it('exporta downloadPdf', () => {
    const ctrl = require('../src/controllers/adminPedidoController');
    assert.equal(typeof ctrl.downloadPdf, 'function');
  });
});
