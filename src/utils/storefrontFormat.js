const WA_PHONE = '573044174238';
const FREE_SHIPPING_MIN = 100000;

function formatPrice(n) {
  const value = Math.round(Number(n) || 0);
  return `$${value.toLocaleString('es-CO')}`;
}

function formatPriceBlock(price, oldPrice) {
  const del = oldPrice ? ` <del>${formatPrice(oldPrice)}</del>` : '';
  return `${formatPrice(price)}${del}`;
}

function waLink(text) {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return '';
  return String(baseUrl).trim().replace(/\/$/, '');
}

function absoluteMediaUrl(src, baseUrl) {
  if (!src) return '';
  const value = String(src).trim();
  if (/^https?:\/\//i.test(value)) return value;
  const base = normalizeBaseUrl(baseUrl);
  if (!base) return value.startsWith('/') ? value : '';
  try {
    return new URL(value.startsWith('/') ? value : `/${value}`, `${base}/`).href;
  } catch {
    return '';
  }
}

function buildProductPageUrl(baseUrl, sku) {
  const base = normalizeBaseUrl(baseUrl);
  if (!base || !sku) return '';
  const params = new URLSearchParams({ p: String(sku) });
  return `${base}/?${params.toString()}#productos`;
}

function formatWhatsAppLineItem(p, baseUrl, { qty = 1, lineNumber = 1 } = {}) {
  if (!p) return '';
  const sku = p.sku || '';
  const name = p.name || 'Producto';
  const unit = Math.round(Number(p.price) || 0);
  const quantity = Math.max(1, Math.round(Number(qty) || 1));
  const subtotal = unit * quantity;
  const productUrl = buildProductPageUrl(baseUrl, sku);
  const img = absoluteMediaUrl(p?.images?.[0]?.src, baseUrl);

  let block = `${lineNumber}. ${name}\nCódigo: ${sku}\nCantidad: ${quantity}\nPrecio unitario: ${formatPrice(unit)}\nTotal: ${formatPrice(subtotal)}`;
  if (productUrl) block += `\nEnlace producto: ${productUrl}`;
  if (img) block += `\nImagen: ${img}`;
  return block;
}

function buildOrderWhatsAppMessage(items, baseUrl, freeShippingMin = FREE_SHIPPING_MIN) {
  const lines = (items || [])
    .map((entry, i) => {
      const p = entry.product || entry.p;
      const qty = entry.qty ?? 1;
      return formatWhatsAppLineItem(p, baseUrl, { qty, lineNumber: i + 1 });
    })
    .filter(Boolean);

  if (!lines.length) {
    return '¡Hola! Quiero consultar disponibilidad en Oasis Piercing. ¡Gracias!';
  }

  const total = (items || []).reduce((sum, entry) => {
    const p = entry.product || entry.p;
    if (!p) return sum;
    const qty = Math.max(1, Math.round(Number(entry.qty) || 1));
    return sum + Math.round(Number(p.price) || 0) * qty;
  }, 0);

  const shippingLine = total >= freeShippingMin
    ? '\n🚚 *Envío gratis en Colombia*'
    : `\n🚚 Envío gratis desde ${formatPrice(freeShippingMin)}`;

  return `¡Hola! Quiero hacer el siguiente pedido en Oasis Piercing:\n\n${lines.join('\n\n')}\n\n*Total pedido: ${formatPrice(total)}*${shippingLine}\n\n¿Podrían confirmar disponibilidad y forma de pago? ¡Gracias!`;
}

function buildProductWhatsAppMessage(p, baseUrl) {
  return buildOrderWhatsAppMessage([{ product: p, qty: 1 }], baseUrl);
}

/** Solo URLs seguras para atributo src en HTML. */
function safeImageSrc(src) {
  if (!src) return '';
  const value = String(src).trim();
  if (value.startsWith('/') || /^https?:\/\//i.test(value)) return value;
  return '';
}

function escapeHtmlAttr(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

module.exports = {
  WA_PHONE,
  formatPrice,
  formatPriceBlock,
  waLink,
  normalizeBaseUrl,
  absoluteMediaUrl,
  buildProductPageUrl,
  buildOrderWhatsAppMessage,
  formatWhatsAppLineItem,
  buildProductWhatsAppMessage,
  safeImageSrc,
  escapeHtmlAttr,
};
