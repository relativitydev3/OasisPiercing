const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const { publicDir } = require('./paths');
const { pedidoEstadoLabel } = require('../config/pedidoEstados');
const { getClientConfig } = require('../config/site');
const { pickPoemaForCliente } = require('../data/poemasClientas');

const COLORS = {
  gold: '#D4A853',
  goldDark: '#B8892E',
  ink: '#14141C',
  text: '#2A2A35',
  muted: '#6B6B7B',
  border: '#E4E4EA',
  panel: '#F7F7FA',
  white: '#FFFFFF',
};

const MARGIN = 48;
const PAGE_WIDTH = 595.28;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const TABLE_COLS = [
  { key: 'producto', label: 'Producto', width: 190, align: 'left' },
  { key: 'codigo', label: 'Código', width: 78, align: 'left' },
  { key: 'cantidad', label: 'Cant.', width: 42, align: 'center' },
  { key: 'precio', label: 'P. unit.', width: 78, align: 'right' },
  { key: 'subtotal', label: 'Subtotal', width: 87, align: 'right' },
];

function formatCop(value) {
  const amount = Number(value) || 0;
  return `$${amount.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatPedidoDate(date) {
  return new Date(date).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function safeFilename(numeroPedido) {
  return `pedido-${String(numeroPedido || 'venta').replace(/[^a-z0-9-]+/gi, '-').replace(/-+/g, '-')}.pdf`;
}

function truncate(text, max = 42) {
  const value = String(text || '');
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function estadoColor(estado) {
  const map = {
    pendiente: '#B8892E',
    confirmado: '#3B82F6',
    en_preparacion: '#8B5CF6',
    enviado: '#0EA5E9',
    entregado: '#16A34A',
    cancelado: '#DC2626',
  };
  return map[estado] || COLORS.muted;
}

function ensureSpace(doc, needed = 80) {
  if (doc.y + needed <= doc.page.height - MARGIN) return;
  doc.addPage();
  doc.y = MARGIN;
}

function drawSectionTitle(doc, title) {
  ensureSpace(doc, 40);
  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text(title.toUpperCase(), MARGIN, doc.y, { width: CONTENT_WIDTH, characterSpacing: 0.8 });
  doc.moveDown(0.6);
}

function drawInfoPanel(doc, rows) {
  ensureSpace(doc, 30 + rows.length * 18);
  const panelY = doc.y;
  const panelHeight = 16 + rows.length * 18;

  doc
    .roundedRect(MARGIN, panelY, CONTENT_WIDTH, panelHeight, 8)
    .fill(COLORS.panel);

  let y = panelY + 12;
  rows.forEach((row) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(row.label, MARGIN + 14, y, { width: 90 });
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.text)
      .text(row.value, MARGIN + 104, y, { width: CONTENT_WIDTH - 118 });
    y += 18;
  });

  doc.y = panelY + panelHeight + 14;
}

function drawTableHeader(doc) {
  ensureSpace(doc, 36);
  const headerY = doc.y;
  const headerHeight = 24;

  doc
    .rect(MARGIN, headerY, CONTENT_WIDTH, headerHeight)
    .fill(COLORS.ink);

  let x = MARGIN + 10;
  TABLE_COLS.forEach((col) => {
    doc
      .font('Helvetica-Bold')
      .fontSize(8.5)
      .fillColor(COLORS.white)
      .text(col.label.toUpperCase(), x, headerY + 8, {
        width: col.width - 12,
        align: col.align,
        characterSpacing: 0.4,
      });
    x += col.width;
  });

  doc.y = headerY + headerHeight;
}

function drawTableRow(doc, item, index) {
  ensureSpace(doc, 28);
  const rowY = doc.y;
  const rowHeight = 24;
  const bg = index % 2 === 0 ? COLORS.white : COLORS.panel;

  doc.rect(MARGIN, rowY, CONTENT_WIDTH, rowHeight).fill(bg);

  const values = {
    producto: truncate(item.producto_nombre, 38),
    codigo: truncate(item.producto_codigo, 14),
    cantidad: String(item.cantidad),
    precio: formatCop(item.precio_unitario),
    subtotal: formatCop(item.subtotal),
  };

  let x = MARGIN + 10;
  TABLE_COLS.forEach((col) => {
    doc
      .font(col.key === 'producto' ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(9)
      .fillColor(COLORS.text)
      .text(values[col.key], x, rowY + 8, {
        width: col.width - 12,
        align: col.align,
      });
    x += col.width;
  });

  doc
    .moveTo(MARGIN, rowY + rowHeight)
    .lineTo(MARGIN + CONTENT_WIDTH, rowY + rowHeight)
    .strokeColor(COLORS.border)
    .lineWidth(0.5)
    .stroke();

  doc.y = rowY + rowHeight;
}

function drawTotalBox(doc, total, itemCount) {
  ensureSpace(doc, 70);
  const boxY = doc.y + 6;
  const boxHeight = 52;

  doc
    .roundedRect(MARGIN + CONTENT_WIDTH - 230, boxY, 230, boxHeight, 8)
    .fill('#FFF9EE');

  doc
    .rect(MARGIN + CONTENT_WIDTH - 230, boxY, 4, boxHeight)
    .fill(COLORS.gold);

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor(COLORS.muted)
    .text(`${itemCount} producto${itemCount === 1 ? '' : 's'}`, MARGIN + CONTENT_WIDTH - 212, boxY + 12, { width: 190 });

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(COLORS.ink)
    .text('TOTAL', MARGIN + CONTENT_WIDTH - 212, boxY + 28, { width: 60 });

  doc
    .font('Helvetica-Bold')
    .fontSize(16)
    .fillColor(COLORS.goldDark)
    .text(formatCop(total), MARGIN + CONTENT_WIDTH - 212, boxY + 24, { width: 190, align: 'right' });

  doc.y = boxY + boxHeight + 18;
}

function drawPoemaSection(doc, poema) {
  if (!poema?.trim()) return;

  const textWidth = CONTENT_WIDTH - 28;
  doc.font('Helvetica-Oblique').fontSize(10.5);
  const textHeight = doc.heightOfString(poema.trim(), { width: textWidth, lineGap: 4 });
  const boxHeight = textHeight + 34;

  ensureSpace(doc, boxHeight + 12);
  const boxY = doc.y + 4;

  doc
    .roundedRect(MARGIN, boxY, CONTENT_WIDTH, boxHeight, 8)
    .fill('#FFF9EE');

  doc
    .rect(MARGIN, boxY, 3, boxHeight)
    .fill(COLORS.gold);

  doc
    .font('Helvetica-Bold')
    .fontSize(8.5)
    .fillColor(COLORS.goldDark)
    .text('PARA TI', MARGIN + 16, boxY + 12, { characterSpacing: 0.6 });

  doc
    .font('Helvetica-Oblique')
    .fontSize(10.5)
    .fillColor(COLORS.text)
    .text(poema.trim(), MARGIN + 16, boxY + 26, {
      width: textWidth,
      lineGap: 4,
      align: 'center',
    });

  doc.y = boxY + boxHeight + 16;
}

function drawFooter(doc, site) {
  const footerY = doc.page.height - MARGIN - 36;

  doc
    .moveTo(MARGIN, footerY)
    .lineTo(MARGIN + CONTENT_WIDTH, footerY)
    .strokeColor(COLORS.border)
    .lineWidth(1)
    .stroke();

  doc
    .font('Helvetica-Bold')
    .fontSize(9)
    .fillColor(COLORS.ink)
    .text(site.name, MARGIN, footerY + 10, { width: CONTENT_WIDTH / 2 });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(`${site.email} · ${site.phone}`, MARGIN, footerY + 22, { width: CONTENT_WIDTH / 2 });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor(COLORS.muted)
    .text(`Generado el ${formatPedidoDate(new Date())}`, MARGIN, footerY + 10, {
      width: CONTENT_WIDTH,
      align: 'right',
    });
}

function buildPedidoPdf(pedido, req) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: MARGIN, bufferPages: true });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const site = getClientConfig(req);
    const estado = pedidoEstadoLabel(pedido.estado);
    const cliente = `${pedido.cliente_nombre} ${pedido.cliente_apellido}`.trim();
    const logoPath = path.join(publicDir, 'images', 'logo-sin-fondo.png');

    doc.rect(0, 0, PAGE_WIDTH, 6).fill(COLORS.gold);

    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, MARGIN, 28, { height: 46 });
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(20)
      .fillColor(COLORS.ink)
      .text(site.name, MARGIN + 58, 30, { width: 250 });

    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(COLORS.muted)
      .text(site.tagline, MARGIN + 58, 54, { width: 250 });

    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor(COLORS.goldDark)
      .text('COMPROBANTE DE PEDIDO', MARGIN, 34, { width: CONTENT_WIDTH, align: 'right', characterSpacing: 0.6 });

    doc
      .font('Helvetica-Bold')
      .fontSize(18)
      .fillColor(COLORS.ink)
      .text(pedido.numero_pedido, MARGIN, 52, { width: CONTENT_WIDTH, align: 'right' });

    doc.y = 92;

    doc
      .moveTo(MARGIN, doc.y)
      .lineTo(MARGIN + CONTENT_WIDTH, doc.y)
      .strokeColor(COLORS.border)
      .lineWidth(1)
      .stroke();

    doc.y += 16;

    const metaY = doc.y;
    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text('FECHA', MARGIN, metaY);
    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor(COLORS.text)
      .text(formatPedidoDate(pedido.created_at), MARGIN, metaY + 12, { width: 220 });

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor(COLORS.muted)
      .text('ESTADO', MARGIN + 250, metaY);
    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .fillColor(estadoColor(pedido.estado))
      .text(estado, MARGIN + 250, metaY + 12, { width: 180 });

    doc.y = metaY + 40;

    drawSectionTitle(doc, 'Datos del cliente');
    drawInfoPanel(doc, [
      { label: 'Nombre', value: cliente },
      { label: 'Dirección', value: pedido.cliente_direccion },
    ]);

    drawSectionTitle(doc, 'Detalle de productos');
    drawTableHeader(doc);

    (pedido.items || []).forEach((item, index) => {
      drawTableRow(doc, item, index);
    });

    drawTotalBox(doc, pedido.total, pedido.items?.length || 0);

    if (pedido.notas?.trim()) {
      drawSectionTitle(doc, 'Notas');
      ensureSpace(doc, 50);
      doc
        .roundedRect(MARGIN, doc.y, CONTENT_WIDTH, 56, 8)
        .fill(COLORS.panel);
      doc
        .font('Helvetica')
        .fontSize(10)
        .fillColor(COLORS.text)
        .text(pedido.notas.trim(), MARGIN + 14, doc.y + 12, {
          width: CONTENT_WIDTH - 28,
          lineGap: 2,
        });
      doc.y += 68;
    }

    drawPoemaSection(doc, pickPoemaForCliente(pedido.cliente_nombre));

    drawFooter(doc, site);
    doc.end();
  });
}

module.exports = {
  COLORS,
  formatCop,
  formatPedidoDate,
  safeFilename,
  buildPedidoPdf,
};
