const WA_PHONE = '573156819093';

function formatPrice(n) {
  return `$${Number(n).toLocaleString('es-CO')}`;
}

function formatPriceBlock(price, oldPrice) {
  const del = oldPrice ? ` <del>${formatPrice(oldPrice)}</del>` : '';
  return `${formatPrice(price)}${del}`;
}

function waLink(text) {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

function buildProductWhatsAppMessage(p) {
  const img = p.images?.[0]?.src || '';
  let msg = `Hola! Me interesa ${p.name} (${p.sku})\n cantidad: 1 — precio unidad ${formatPrice(p.price)}\ntotal de 1: ${formatPrice(p.price)}`;
  if (img) msg += `\nurl imagen: ${img}`;
  msg += '\n\n¿Tienen disponibilidad?';
  return msg;
}

/** Solo URLs seguras para atributo src en HTML. */
function safeImageSrc(src) {
  if (!src) return '';
  const value = String(src).trim();
  if (value.startsWith('/') || /^https?:\/\//i.test(value)) return value;
  return '';
}

module.exports = {
  WA_PHONE,
  formatPrice,
  formatPriceBlock,
  waLink,
  buildProductWhatsAppMessage,
  safeImageSrc,
};
