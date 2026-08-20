/* -----------------------------------------------------------
   CURSOR (solo puntero fino — móvil/tablet táctil)
   ----------------------------------------------------------- */
(function() {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;

  let rx = 0, ry = 0, mx = 0, my = 0;

  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  document.addEventListener('mousedown', () => document.body.classList.add('cursor-press'));
  document.addEventListener('mouseup',   () => document.body.classList.remove('cursor-press'));

  function animate() {
    rx += (mx - rx) * 0.13;
    ry += (my - ry) * 0.13;
    dot.style.left  = mx + 'px';
    dot.style.top   = my + 'px';
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(animate);
  }
  animate();

  document.querySelectorAll('a, button, .cat-card, .prod-card, .bento-card, .test-card, .faq-q').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
})();

/* -----------------------------------------------------------
   SCROLL PROGRESS
   ----------------------------------------------------------- */
window.addEventListener('scroll', () => {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
  bar.style.width = pct + '%';
}, { passive: true });

/* -----------------------------------------------------------
   NAVBAR
   ----------------------------------------------------------- */
window.addEventListener('scroll', () => {
  document.getElementById('nav')?.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* -----------------------------------------------------------
   MOBILE MENU
   ----------------------------------------------------------- */
document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('mobileMenu')?.classList.add('open');
});
document.getElementById('mobileClose')?.addEventListener('click', () => {
  document.getElementById('mobileMenu')?.classList.remove('open');
});
function closeMobile() {
  document.getElementById('mobileMenu')?.classList.remove('open');
}
window.closeMobile = closeMobile;

/* -----------------------------------------------------------
   SMOOTH SCROLL
   ----------------------------------------------------------- */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    if (id === '#') return;
    const el = document.querySelector(id);
    if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });
});

/* -----------------------------------------------------------
   INTERSECTION OBSERVER — scroll reveal
   ----------------------------------------------------------- */
function makeObserver(threshold = 0.12) {
  return new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const delay = parseFloat(el.dataset.delay || 0) * 1000;
      setTimeout(() => el.classList.add('visible'), delay);
      obs.unobserve(el);
    });
  }, { threshold, rootMargin: '0px 0px -40px 0px' });
}
const revealObs = makeObserver(0.12);
document.querySelectorAll([
  '.bento-card', '.cat-card', '.stat-item',
  '.problem-item', '#solutionCard', '.process-step',
  '.compare-row', '.faq-item', '.reveal', '.section-header'
].join(',')).forEach(el => revealObs.observe(el));

/* -----------------------------------------------------------
   FAQ ACCORDION
   ----------------------------------------------------------- */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item.open').forEach((i) => {
    i.classList.remove('open');
    i.querySelector('.faq-q')?.setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

function initFaqAccordion() {
  document.querySelectorAll('.faq-item').forEach((item) => item.classList.add('visible'));

  document.querySelectorAll('.faq-list').forEach((list) => {
    if (list.dataset.faqBound) return;
    list.dataset.faqBound = '1';
    list.addEventListener('click', (e) => {
      const btn = e.target.closest('.faq-q');
      if (!btn || !list.contains(btn)) return;
      e.preventDefault();
      toggleFaq(btn);
    });
  });
}

window.toggleFaq = toggleFaq;
initFaqAccordion();

/* -----------------------------------------------------------
   PRODUCT CATALOG — filtro dinámico por categoría
   ----------------------------------------------------------- */
const WA_PHONE = '573044174238';

let CATEGORIES = [{ id: 'all', label: 'Todos' }];
let PRODUCTS = [];
let PRODUCTS_BY_SKU = {};
let activeModalImage = 0;
let openModalProduct = null;
let activeMobileImage = 0;

const PRODUCTS_PER_PAGE_DESKTOP = 8;
const PRODUCTS_PER_PAGE_MOBILE = 6;
let activeProductFilter = 'all';
let currentProductPage = 1;

const MOBILE_MQ = window.matchMedia('(max-width: 768px)');

function isMobileLayout() {
  return MOBILE_MQ.matches;
}

function getProductsPerPage() {
  return isMobileLayout() ? PRODUCTS_PER_PAGE_MOBILE : PRODUCTS_PER_PAGE_DESKTOP;
}

function getCatalogUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    cat: params.get('cat') || 'all',
    page: Math.max(1, parseInt(params.get('page') || '1', 10) || 1),
    producto: params.get('p') || '',
  };
}

function buildCatalogUrl({ cat, page, producto } = {}) {
  const params = new URLSearchParams();
  const c = cat ?? activeProductFilter;
  const pg = page ?? currentProductPage;
  const sku = producto ?? '';

  if (c && c !== 'all') params.set('cat', c);
  if (pg > 1) params.set('page', String(pg));
  if (sku) params.set('p', sku);

  const qs = params.toString();
  return `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash || ''}`;
}

function syncCatalogToUrl({ producto = '', replace = false } = {}) {
  const state = {
    cat: activeProductFilter,
    page: currentProductPage,
    producto: producto || '',
  };
  const url = buildCatalogUrl(state);
  if (replace) {
    history.replaceState(state, '', url);
  } else {
    history.pushState(state, '', url);
  }
}

function updateFilterButtons(cat) {
  document.querySelectorAll('.prod-filter').forEach((btn) => {
    const on = btn.dataset.filter === cat;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });
}

function formatPrice(n) {
  return '$' + n.toLocaleString('es-CO');
}

function getFreeShippingMin() {
  const min = Number(window.OASIS_CONFIG?.freeShippingMin);
  return Number.isFinite(min) && min > 0 ? min : 100000;
}

function waLink(text) {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

function getSiteBaseUrl() {
  const cfg = window.OASIS_CONFIG;
  if (cfg?.url) return String(cfg.url).replace(/\/$/, '');
  const { origin, protocol, pathname } = window.location;
  if (protocol === 'http:' || protocol === 'https:') {
    const base = pathname.endsWith('/') ? pathname : pathname.replace(/\/[^/]*$/, '');
    return `${origin}${base}`.replace(/\/$/, '');
  }
  return origin;
}

function absoluteImageUrl(src) {
  if (!src) return '';
  const value = String(src).trim();
  if (/^https?:\/\//i.test(value)) return value;
  const base = getSiteBaseUrl();
  if (!base) return value.startsWith('/') ? value : '';
  try {
    return new URL(value.startsWith('/') ? value : `/${value}`, `${base}/`).href;
  } catch {
    return value;
  }
}

function buildProductPageUrl(sku) {
  const base = getSiteBaseUrl();
  if (!base || !sku) return '';
  const params = new URLSearchParams({ p: String(sku) });
  return `${base}/?${params.toString()}#productos`;
}

function formatWhatsAppLineItem(p, qty, lineNumber) {
  if (!p) return '';
  const quantity = Math.max(1, Math.round(Number(qty) || 1));
  const unit = Math.round(Number(p.price) || 0);
  const subtotal = unit * quantity;
  const productUrl = buildProductPageUrl(p.sku);
  const img = absoluteImageUrl(p.images?.[0]?.src || '');

  let block = `${lineNumber}. ${p.name}\nCódigo: ${p.sku}\nCantidad: ${quantity}\nPrecio unitario: ${formatPrice(unit)}\nTotal: ${formatPrice(subtotal)}`;
  if (productUrl) block += `\nEnlace producto: ${productUrl}`;
  if (img) block += `\nImagen: ${img}`;
  return block;
}

function buildOrderWhatsAppMessage(lineItems) {
  const entries = (lineItems || []).filter((row) => row?.p);
  const blocks = entries.map(({ p, qty }, i) => formatWhatsAppLineItem(p, qty, i + 1)).filter(Boolean);

  if (!blocks.length) {
    return '¡Hola! Quiero consultar disponibilidad en Oasis Piercing. ¡Gracias!';
  }

  const total = entries.reduce(
    (sum, { p, qty }) => sum + Math.round(Number(p.price) || 0) * Math.max(1, Number(qty) || 1),
    0,
  );

  const shippingLine = total >= getFreeShippingMin()
    ? '\n🚚 *Envío gratis en Colombia*'
    : `\n🚚 Envío gratis desde ${formatPrice(getFreeShippingMin())}`;

  return `¡Hola! Quiero hacer el siguiente pedido en Oasis Piercing:\n\n${blocks.join('\n\n')}\n\n*Total pedido: ${formatPrice(total)}*${shippingLine}\n\n¿Podrían confirmar disponibilidad y forma de pago? ¡Gracias!`;
}

function openWhatsApp(text) {
  const a = document.createElement('a');
  a.href = waLink(text);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* -----------------------------------------------------------
   PEDIDOS TIENDA (POST /api/pedidos → WhatsApp)
   ----------------------------------------------------------- */
let checkoutPendingResolve = null;
let checkoutPendingReject = null;
let authGateReject = null;
let confirmPendingResolve = null;
let confirmPendingReject = null;
let orderSubmitting = false;

const PENDING_CHECKOUT_KEY = 'oasis-pending-checkout';

function markPendingCheckout() {
  sessionStorage.setItem(PENDING_CHECKOUT_KEY, '1');
}

function consumePendingCheckout() {
  if (sessionStorage.getItem(PENDING_CHECKOUT_KEY) !== '1') return false;
  sessionStorage.removeItem(PENDING_CHECKOUT_KEY);
  return true;
}

function resumePendingCheckout() {
  if (!getStoreConfig().user || !consumePendingCheckout()) return;
  showCartToast('¡Listo! Ya puedes completar tu pedido.');
  openCart();
}

function getStoreConfig() {
  return window.OASIS_STORE || { csrfToken: '', user: null };
}

function clienteFromSessionUser(user) {
  if (!user) return null;
  const cliente_nombre = String(user.nombre || '').trim();
  const cliente_apellido = String(user.apellido || '').trim();
  const cliente_telefono = String(user.telefono || '').trim();
  const cliente_direccion = String(user.direccion || '').trim();
  if (!cliente_nombre || !cliente_apellido || !cliente_telefono || !cliente_direccion) return null;
  return { cliente_nombre, cliente_apellido, cliente_telefono, cliente_direccion, notas: '' };
}

function prefillCheckoutForm(user) {
  const set = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
  };
  if (!user) return;
  set('checkoutNombre', user.nombre);
  set('checkoutApellido', user.apellido);
  set('checkoutTelefono', sanitizeDigits10(user.telefono));
  set('checkoutDireccion', user.direccion);
}

const DIGITS_10_REGEX = /^\d{10}$/;

function sanitizeDigits10(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 10);
}

function validateDigits10Value(value, label) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return `${label} es obligatorio.`;
  if (!DIGITS_10_REGEX.test(trimmed)) {
    return `${label} debe contener solo números y tener exactamente 10 dígitos.`;
  }
  return null;
}

function showAuthGateModal() {
  const modal = document.getElementById('authGateModal');
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('is-open');
  document.body.classList.add('checkout-open');
}

function hideAuthGateModal() {
  const modal = document.getElementById('authGateModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  if (!document.getElementById('checkoutModal')?.classList.contains('is-open')
    && !document.getElementById('orderConfirmModal')?.classList.contains('is-open')) {
    document.body.classList.remove('checkout-open');
  }
}

function closeAuthGateModal(cancelled = true) {
  hideAuthGateModal();
  if (cancelled && authGateReject) {
    authGateReject(Object.assign(new Error('auth_required'), { cancelled: true }));
  }
  authGateReject = null;
}

function initAuthGateModal() {
  const modal = document.getElementById('authGateModal');
  if (!modal || modal.dataset.bound) return;
  modal.dataset.bound = '1';

  modal.querySelectorAll('[data-auth-gate-close]').forEach((el) => {
    el.addEventListener('click', () => closeAuthGateModal(true));
  });

  document.getElementById('authGateRegister')?.addEventListener('click', () => {
    markPendingCheckout();
    closeAuthGateModal(false);
  });

  document.getElementById('authGateLogin')?.addEventListener('click', () => {
    markPendingCheckout();
    closeAuthGateModal(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeAuthGateModal(true);
    }
  });
}

function showCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('is-open');
  document.body.classList.add('checkout-open');
}

function hideCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('checkout-open');
}

function openCheckoutModal() {
  return new Promise((resolve, reject) => {
    checkoutPendingResolve = resolve;
    checkoutPendingReject = reject;

    const form = document.getElementById('checkoutForm');
    const errorEl = document.getElementById('checkoutError');
    if (form) form.reset();
    if (errorEl) errorEl.hidden = true;

    prefillCheckoutForm(getStoreConfig().user);
    showCheckoutModal();
    document.getElementById('checkoutNombre')?.focus();
    bindCursorHover(document.querySelectorAll('#checkoutModal .checkout-close, #checkoutModal .checkout-btn'));
  });
}

function closeCheckoutModal(cancelled = false) {
  hideCheckoutModal();
  if (cancelled && checkoutPendingReject) {
    checkoutPendingReject(Object.assign(new Error('checkout_cancelled'), { cancelled: true }));
  }
  checkoutPendingResolve = null;
  checkoutPendingReject = null;
}

function initCheckoutModal() {
  const modal = document.getElementById('checkoutModal');
  const form = document.getElementById('checkoutForm');
  if (!modal || !form || form.dataset.bound) return;
  form.dataset.bound = '1';

  modal.querySelectorAll('[data-checkout-close]').forEach((el) => {
    el.addEventListener('click', () => closeCheckoutModal(true));
  });

  const telefonoInput = document.getElementById('checkoutTelefono');
  telefonoInput?.addEventListener('input', () => {
    telefonoInput.value = sanitizeDigits10(telefonoInput.value);
  });
  telefonoInput?.addEventListener('paste', (event) => {
    event.preventDefault();
    telefonoInput.value = sanitizeDigits10(event.clipboardData?.getData('text') || '');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const errorEl = document.getElementById('checkoutError');
    const submitBtn = document.getElementById('checkoutSubmit');
    const cliente_nombre = document.getElementById('checkoutNombre')?.value.trim() || '';
    const cliente_apellido = document.getElementById('checkoutApellido')?.value.trim() || '';
    const cliente_telefono = sanitizeDigits10(document.getElementById('checkoutTelefono')?.value);
    const cliente_direccion = document.getElementById('checkoutDireccion')?.value.trim() || '';
    const notas = document.getElementById('checkoutNotas')?.value.trim() || '';

    const telefonoError = validateDigits10Value(cliente_telefono, 'El teléfono');
    if (!cliente_nombre || !cliente_apellido || !cliente_direccion || telefonoError) {
      if (errorEl) {
        errorEl.textContent = telefonoError || 'Completa todos los campos obligatorios.';
        errorEl.hidden = false;
      }
      return;
    }

    if (errorEl) errorEl.hidden = true;
    if (submitBtn) submitBtn.disabled = true;

    const payload = { cliente_nombre, cliente_apellido, cliente_telefono, cliente_direccion, notas };
    hideCheckoutModal();
    checkoutPendingResolve?.(payload);
    checkoutPendingResolve = null;
    checkoutPendingReject = null;
    if (submitBtn) submitBtn.disabled = false;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeCheckoutModal(true);
    }
  });
}

async function resolveClienteData() {
  const user = getStoreConfig().user;
  if (!user) {
    return new Promise((_, reject) => {
      authGateReject = reject;
      showAuthGateModal();
    });
  }

  const sessionCliente = clienteFromSessionUser(user);
  if (sessionCliente) return sessionCliente;

  return openCheckoutModal();
}

function getLineItemsTotal(lineItems) {
  return (lineItems || []).reduce(
    (sum, { p, qty }) => sum + Math.round(Number(p?.price) || 0) * Math.max(1, Math.round(Number(qty) || 1)),
    0,
  );
}

function getLineItemsCount(lineItems) {
  return (lineItems || []).reduce(
    (sum, { qty }) => sum + Math.max(1, Math.round(Number(qty) || 1)),
    0,
  );
}

function showOrderConfirmModal() {
  const modal = document.getElementById('orderConfirmModal');
  if (!modal) return;
  modal.hidden = false;
  modal.setAttribute('aria-hidden', 'false');
  modal.classList.add('is-open');
  document.body.classList.add('checkout-open');
}

function hideOrderConfirmModal() {
  const modal = document.getElementById('orderConfirmModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.hidden = true;
  modal.setAttribute('aria-hidden', 'true');
  if (!document.getElementById('checkoutModal')?.classList.contains('is-open')) {
    document.body.classList.remove('checkout-open');
  }
}

function renderOrderConfirmItems(lineItems) {
  const el = document.getElementById('orderConfirmItems');
  if (!el) return;

  el.innerHTML = (lineItems || [])
    .filter((row) => row?.p)
    .map(({ p, qty }) => {
      const q = Math.max(1, Math.round(Number(qty) || 1));
      const img = p.images?.[0];
      const imgSrc = img ? safeImageSrc(img.src) : '';
      const imgHtml = imgSrc
        ? `<img src="${imgSrc}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.classList.add('has-fallback');this.parentElement.dataset.fallback='${escapeAttr(p.emoji)}'">`
        : `<span class="order-confirm-item-emoji">${escapeHtml(p.emoji)}</span>`;
      return `
        <article class="order-confirm-item">
          <div class="order-confirm-item-img${imgSrc ? '' : ' has-fallback'}"${imgSrc ? '' : ` data-fallback="${escapeAttr(p.emoji)}"`}>${imgHtml}</div>
          <div class="order-confirm-item-body">
            <div class="order-confirm-item-name">${escapeHtml(p.name)}</div>
            <div class="order-confirm-item-meta"># ${escapeHtml(p.sku)}</div>
            <div class="order-confirm-item-row">
              <span class="order-confirm-item-qty">Cantidad: ${q}</span>
              <span class="order-confirm-item-price">${formatPrice(Math.round(Number(p.price) || 0) * q)}</span>
            </div>
          </div>
        </article>`;
    })
    .join('');

  el.querySelectorAll('.order-confirm-item-img.has-fallback').forEach((box) => {
    if (!box.textContent.trim() && box.dataset.fallback) {
      box.textContent = box.dataset.fallback;
    }
  });
}

function openOrderConfirmModal({ lineItems, clienteData }) {
  return new Promise((resolve, reject) => {
    confirmPendingResolve = resolve;
    confirmPendingReject = reject;

    const count = getLineItemsCount(lineItems);
    const total = getLineItemsTotal(lineItems);
    const nombre = clienteData?.cliente_nombre || 'Hola';
    const piezaLabel = count === 1 ? 'pieza' : 'piezas';

    const leadEl = document.getElementById('orderConfirmLead');
    const summaryEl = document.getElementById('orderConfirmSummary');
    const totalEl = document.getElementById('orderConfirmTotal');

    if (leadEl) {
      leadEl.textContent = `${nombre}, revisa tu pedido antes de enviarlo por WhatsApp.`;
    }
    if (summaryEl) {
      summaryEl.textContent = `${count} ${piezaLabel}`;
    }
    if (totalEl) {
      totalEl.textContent = formatPrice(total);
    }

    renderOrderConfirmItems(lineItems);
    showOrderConfirmModal();
    document.getElementById('orderConfirmSend')?.focus();
    bindCursorHover(document.querySelectorAll('#orderConfirmModal .checkout-close, #orderConfirmModal .checkout-btn'));
  });
}

function closeOrderConfirmModal(cancelled = false) {
  hideOrderConfirmModal();
  document.body.classList.remove('checkout-open');
  const sendBtn = document.getElementById('orderConfirmSend');
  if (sendBtn) {
    sendBtn.disabled = false;
    sendBtn.textContent = 'Sí, enviar por WhatsApp';
  }
  if (cancelled && confirmPendingReject) {
    confirmPendingReject(Object.assign(new Error('confirm_cancelled'), { cancelled: true }));
  }
  confirmPendingResolve = null;
  confirmPendingReject = null;
}

function initOrderConfirmModal() {
  const modal = document.getElementById('orderConfirmModal');
  const sendBtn = document.getElementById('orderConfirmSend');
  if (!modal || modal.dataset.bound) return;
  modal.dataset.bound = '1';

  modal.querySelectorAll('[data-confirm-close]').forEach((el) => {
    el.addEventListener('click', () => closeOrderConfirmModal(true));
  });

  sendBtn?.addEventListener('click', () => {
    sendBtn.disabled = true;
    sendBtn.textContent = 'Registrando pedido…';
    confirmPendingResolve?.();
    confirmPendingResolve = null;
    confirmPendingReject = null;
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeOrderConfirmModal(true);
    }
  });
}

function lineItemsToApiItems(lineItems) {
  return (lineItems || [])
    .filter((row) => row?.p)
    .map(({ p, qty }) => ({
      producto_id: p.id || undefined,
      sku: p.sku,
      cantidad: Math.max(1, Math.round(Number(qty) || 1)),
    }));
}

async function createStorefrontOrder({ items, origen, notas = '' }) {
  const { csrfToken } = getStoreConfig();
  const res = await fetch('/api/pedidos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken,
    },
    body: JSON.stringify({ items, origen, notas }),
  });

  const data = await res.json().catch(() => ({}));
  if (res.status === 401 || data.code === 'auth_required') {
    markPendingCheckout();
    window.location.href = '/registro?pedido=1';
    throw Object.assign(new Error('Debes crear una cuenta para hacer un pedido.'), { cancelled: true });
  }
  if (!res.ok) {
    const msg = data.error
      || data.errors?.profile
      || (data.errors && Object.values(data.errors).join(' '))
      || 'No se pudo crear el pedido. Intenta de nuevo.';
    throw new Error(msg);
  }
  return data.pedido;
}

function buildPedidoWhatsAppMessage(pedido) {
  const num = pedido?.numero_pedido;
  if (!num) return '¡Hola! Tengo un pedido en Oasis Piercing.';
  return `¡Hola! Mi número de pedido es ${num}`;
}

async function submitLineItemsOrder(lineItems, origen) {
  if (orderSubmitting) return;

  const items = lineItemsToApiItems(lineItems);
  if (!items.length) {
    showCartToast('No hay productos válidos en el pedido.');
    return;
  }

  orderSubmitting = true;
  const cartWaBtn = document.getElementById('cartWaBtn');
  if (cartWaBtn) cartWaBtn.disabled = true;

  try {
    const clienteData = await resolveClienteData();

    await openOrderConfirmModal({ lineItems, clienteData });

    const { notas } = clienteData;
    const pedido = await createStorefrontOrder({ items, origen, notas });
    closeOrderConfirmModal(false);
    openWhatsApp(buildPedidoWhatsAppMessage(pedido));

    if (origen === 'carrito') {
      clearCart();
      closeCart();
    }

    showCartToast(`Pedido #${pedido.numero_pedido} registrado`);
  } catch (err) {
    closeOrderConfirmModal(false);
    if (!err?.cancelled) {
      showCartToast(err.message || 'Error al crear el pedido');
    }
  } finally {
    orderSubmitting = false;
    if (cartWaBtn) cartWaBtn.disabled = false;
  }
}

function cardMatchesFilter(card, filter) {
  if (filter === 'all') return true;
  const slugs = (card.dataset.categories || '').split(/\s+/).filter(Boolean);
  return slugs.includes(filter) || card.dataset.category === filter;
}

function getFilteredProductCards() {
  const gridEl = document.getElementById('prodGrid');
  if (!gridEl) return [];
  return [...gridEl.querySelectorAll('.prod-card')].filter((card) =>
    cardMatchesFilter(card, activeProductFilter)
  );
}

function getFilteredProducts() {
  if (document.getElementById('prodGrid')?.dataset.ssr === 'true') {
    return getFilteredProductCards()
      .map((card) => PRODUCTS_BY_SKU[card.dataset.sku])
      .filter(Boolean);
  }
  if (activeProductFilter === 'all') return PRODUCTS;
  return PRODUCTS.filter(p =>
    (p.categories || []).includes(activeProductFilter) || p.category === activeProductFilter
  );
}

function formatPriceBlock(price, oldPrice) {
  const del = oldPrice ? ` <del>${formatPrice(oldPrice)}</del>` : '';
  return `${formatPrice(price)}${del}`;
}

function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/`/g, '&#96;');
}

function safeImageSrc(src) {
  if (!src) return '';
  const value = String(src).trim();
  if (value.startsWith('/') || /^https?:\/\//i.test(value)) return escapeAttr(value);
  return '';
}

function productImgHTML(img, p, className = '') {
  const src = safeImageSrc(img.src);
  const alt = escapeAttr(img.alt);
  const emoji = escapeHtml(p.emoji);
  const fallback = `<span class="prod-img-fallback" hidden>${emoji}</span>`;
  return `<img class="${escapeAttr(className)}" src="${src}" alt="${alt}" loading="lazy" data-fallback="${emoji}" onerror="this.style.display='none';this.nextElementSibling.hidden=false;this.parentElement.classList.add('has-fallback')">${fallback}`;
}

function productCardHTML(p, i) {
  const mainImg = p.images[0];
  const imgBlock = mainImg
    ? productImgHTML(mainImg, p)
    : `<span class="prod-img-fallback">${escapeHtml(p.emoji)}</span>`;
  return `
    <article class="prod-card" data-sku="${escapeAttr(p.sku)}" data-category="${escapeAttr(p.category)}" data-delay="${(i % 4) * 0.1}" tabindex="0" role="button" aria-label="Ver detalles de ${escapeAttr(p.name)}">
      <div class="prod-img">
        <span class="prod-badge">${escapeHtml(p.badge)}</span>
        ${imgBlock}
        <span class="prod-card-hint">Ver detalles</span>
      </div>
      <div class="prod-body">
        <div class="prod-sku"># ${escapeHtml(p.sku)}</div>
        <div class="prod-cat">${escapeHtml(p.categoryLabel)} · ${escapeHtml(p.type)}</div>
        <div class="prod-name">${escapeHtml(p.name)}</div>
        <div class="prod-mat">${escapeHtml(p.material)}</div>
        <p class="prod-desc">${escapeHtml(p.description)}</p>
        <div class="prod-price">${formatPriceBlock(p.price, p.oldPrice)}</div>
        <div class="prod-actions">
          <button type="button" class="prod-btn prod-btn-cart" data-action="cart">+ Carrito</button>
        </div>
      </div>
    </article>`;
}

function bindCursorHover(els) {
  els.forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

function openProductDetail(sku) {
  if (isMobileLayout()) {
    openProductMobileView(sku);
  } else {
    openProductModal(sku);
  }
}

function setMobileProductImage(index) {
  if (!openModalProduct) return;
  resetGalleryZoom(document.getElementById('pmvHero'));
  const imgs = openModalProduct.images || [];
  const mainImg = document.getElementById('pmvMainImg');
  const fallback = document.getElementById('pmvMainFallback');
  if (!mainImg || !fallback) return;

  if (!imgs.length) {
    mainImg.style.display = 'none';
    fallback.hidden = false;
    fallback.textContent = openModalProduct.emoji;
    return;
  }

  activeMobileImage = Math.max(0, Math.min(index, imgs.length - 1));
  const img = imgs[activeMobileImage];

  fallback.hidden = true;
  mainImg.alt = img.alt || openModalProduct.name;
  mainImg.style.transform = '';
  mainImg.style.display = 'block';
  mainImg.onerror = () => {
    mainImg.style.display = 'none';
    fallback.hidden = false;
    fallback.textContent = openModalProduct.emoji;
  };
  mainImg.src = img.src;

  document.querySelectorAll('.pmv-thumb').forEach((btn, i) => {
    btn.classList.toggle('active', i === activeMobileImage);
  });
}

function fillProductMobileView(p) {
  document.getElementById('pmvSku').textContent = `# ${p.sku}`;
  document.getElementById('pmvBadge').textContent = p.badge;
  document.getElementById('pmvCat').textContent = `${p.categoryLabel} · ${p.type}`;
  document.getElementById('pmvTitle').textContent = p.name;
  document.getElementById('pmvMat').textContent = p.material;
  document.getElementById('pmvDesc').textContent = p.description;
  document.getElementById('pmvMetaCat').textContent = p.categoryLabel;
  document.getElementById('pmvMetaType').textContent = p.type;
  document.getElementById('pmvMetaSku').textContent = p.sku;
  document.getElementById('pmvMetaMat').textContent = p.material.split(' · ')[0];
  document.getElementById('pmvPrice').innerHTML = formatPriceBlock(p.price, p.oldPrice);

  document.getElementById('pmvActions').innerHTML = `
    <button type="button" class="prod-btn prod-btn-cart" id="pmvCart">Agregar al carrito</button>`;
  document.getElementById('pmvCart').addEventListener('click', () => {
    addToCart(p.sku);
    closeProductMobileView({ skipHistory: true });
    syncCatalogToUrl({ replace: true });
    openCart();
  });

  const thumbsEl = document.getElementById('pmvThumbs');
  if (!p.images?.length) {
    thumbsEl.innerHTML = '';
  } else {
    thumbsEl.innerHTML = p.images.map((img, i) => `
      <button type="button" class="pmv-thumb${i === 0 ? ' active' : ''}" data-img-index="${i}" aria-label="${escapeAttr(img.alt || p.name)}">
        <img src="${escapeAttr(img.src)}" alt="" loading="lazy" onerror="this.style.display='none'">
      </button>`).join('');
    thumbsEl.querySelectorAll('.pmv-thumb').forEach((btn) => {
      btn.addEventListener('click', () => setMobileProductImage(parseInt(btn.dataset.imgIndex, 10)));
    });
  }

  activeMobileImage = 0;
  setMobileProductImage(0);
}

function openProductMobileView(sku, { skipPush = false } = {}) {
  const p = PRODUCTS_BY_SKU[sku];
  if (!p) return;

  openModalProduct = p;
  resetGalleryZoom(document.getElementById('pmvHero'));
  fillProductMobileView(p);

  const view = document.getElementById('productMobileView');
  view.hidden = false;
  view.classList.add('is-open');
  view.setAttribute('aria-hidden', 'false');
  document.body.classList.add('pmv-open');
  view.querySelector('.pmv-scroll')?.scrollTo(0, 0);
  document.getElementById('productMobileBack')?.focus();

  if (!skipPush) {
    syncCatalogToUrl({ producto: sku, replace: false });
  }
}

function closeProductMobileView({ skipHistory = false, fromPopState = false } = {}) {
  const view = document.getElementById('productMobileView');
  if (!view?.classList.contains('is-open')) return;

  resetGalleryZoom(document.getElementById('pmvHero'));
  view.classList.remove('is-open');
  view.hidden = true;
  view.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('pmv-open');
  openModalProduct = null;

  if (!fromPopState && !skipHistory && getCatalogUrlParams().producto) {
    history.back();
    return;
  }

  if (!fromPopState) {
    syncCatalogToUrl({ replace: true });
  }
}

function handleCatalogPopState(event) {
  const state = event.state || {};
  const params = getCatalogUrlParams();
  const cat = state.cat ?? params.cat ?? 'all';
  const page = state.page ?? params.page ?? 1;
  const producto = state.producto ?? params.producto ?? '';

  if (CATEGORIES.some((c) => c.id === cat)) {
    activeProductFilter = cat;
    currentProductPage = Math.max(1, page);
    updateFilterButtons(cat);
    renderProductCatalog(false);
  }

  if (producto && isMobileLayout() && PRODUCTS_BY_SKU[producto]) {
    openProductMobileView(producto, { skipPush: true });
    return;
  }

  closeProductMobileView({ fromPopState: true });
  requestAnimationFrame(() => {
    document.getElementById('productos')?.scrollIntoView({ behavior: 'auto', block: 'start' });
  });
}

function initProductMobileView() {
  document.getElementById('productMobileBack')?.addEventListener('click', () => {
    closeProductMobileView();
  });

  window.addEventListener('popstate', handleCatalogPopState);

  MOBILE_MQ.addEventListener('change', () => {
    const params = getCatalogUrlParams();
    if (!isMobileLayout()) {
      closeProductMobileView({ fromPopState: true, skipHistory: true });
      if (params.producto && PRODUCTS_BY_SKU[params.producto]) {
        openProductModal(params.producto);
      }
    } else {
      closeProductModal();
      if (params.producto && PRODUCTS_BY_SKU[params.producto]) {
        openProductMobileView(params.producto, { skipPush: true });
      }
    }
    renderProductCatalog();
  });
}

function restoreCatalogFromUrl() {
  const { cat, page, producto } = getCatalogUrlParams();
  const validCat = CATEGORIES.some((c) => c.id === cat) ? cat : 'all';

  activeProductFilter = validCat;
  currentProductPage = page;
  updateFilterButtons(validCat);
  renderProductCatalog(false);

  history.replaceState(
    { cat: validCat, page: currentProductPage, producto: producto || '' },
    '',
    buildCatalogUrl({ cat: validCat, page: currentProductPage, producto })
  );

  if (producto && PRODUCTS_BY_SKU[producto]) {
    if (isMobileLayout()) {
      openProductMobileView(producto, { skipPush: true });
    } else {
      openProductModal(producto);
    }
  }
}

function setModalImage(index) {
  if (!openModalProduct) return;
  resetGalleryZoom(document.getElementById('prodModalMainWrap'));
  const imgs = openModalProduct.images || [];
  const mainImg = document.getElementById('prodModalMainImg');
  const fallback = document.getElementById('prodModalMainFallback');
  if (!mainImg || !fallback) return;

  if (!imgs.length) {
    mainImg.style.display = 'none';
    fallback.hidden = false;
    fallback.textContent = openModalProduct.emoji;
    return;
  }

  activeModalImage = Math.max(0, Math.min(index, imgs.length - 1));
  const img = imgs[activeModalImage];

  fallback.hidden = true;
  fallback.textContent = openModalProduct.emoji;
  mainImg.style.display = 'block';
  mainImg.alt = img.alt;
  mainImg.onload = () => {
    mainImg.style.display = 'block';
    fallback.hidden = true;
  };
  mainImg.onerror = () => {
    mainImg.style.display = 'none';
    fallback.hidden = false;
  };
  mainImg.src = img.src;
  if (mainImg.complete && mainImg.naturalWidth > 0) {
    mainImg.style.display = 'block';
    fallback.hidden = true;
  }

  document.querySelectorAll('.prod-modal-thumb').forEach((btn, i) => {
    btn.classList.toggle('active', i === activeModalImage);
  });
}

const GALLERY_LOUPE_ZOOM = 2.25;
const GALLERY_PAN_ZOOM = 2.5;
const GALLERY_LENS_PX = 132;

function resetGalleryZoom(wrap) {
  if (!wrap) return;
  const img = wrap.querySelector('img');
  const btn = wrap.querySelector('.prod-gallery-zoom-btn');
  const lens = wrap.querySelector('.prod-gallery-lens');
  wrap.classList.remove('is-loupe-active', 'is-pan-zoom', 'is-dragging');
  if (wrap._galleryPan) wrap._galleryPan = { x: 0, y: 0 };
  if (btn) {
    btn.classList.remove('is-active');
    btn.setAttribute('aria-pressed', 'false');
  }
  if (lens) lens.classList.remove('is-visible');
  if (img) img.style.transform = '';
}

function initGalleryZoom({ wrap, img, btn, lens }) {
  if (!wrap || !img || !btn || !lens || wrap.dataset.zoomBound) return;
  wrap.dataset.zoomBound = '1';

  const panModePreferred = window.matchMedia('(pointer: coarse)').matches;
  wrap._galleryPan = { x: 0, y: 0 };
  let dragging = false;
  let dragStart = { x: 0, y: 0, px: 0, py: 0 };

  function setPanTransform() {
    const pan = wrap._galleryPan;
    img.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${GALLERY_PAN_ZOOM})`;
  }

  function clampPan() {
    const pan = wrap._galleryPan;
    const wrapRect = wrap.getBoundingClientRect();
    const scaledW = img.clientWidth * GALLERY_PAN_ZOOM;
    const scaledH = img.clientHeight * GALLERY_PAN_ZOOM;
    const maxX = Math.max(0, (scaledW - wrapRect.width) / 2);
    const maxY = Math.max(0, (scaledH - wrapRect.height) / 2);
    pan.x = Math.min(maxX, Math.max(-maxX, pan.x));
    pan.y = Math.min(maxY, Math.max(-maxY, pan.y));
  }

  function updateLens(clientX, clientY) {
    if (!wrap.classList.contains('is-loupe-active') || img.style.display === 'none') {
      lens.classList.remove('is-visible');
      return;
    }
    const wrapRect = wrap.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();
    if (imgRect.width < 8 || imgRect.height < 8 || !img.src) return;

    const half = GALLERY_LENS_PX / 2;
    let lx = clientX - wrapRect.left - half;
    let ly = clientY - wrapRect.top - half;
    lx = Math.max(0, Math.min(wrapRect.width - GALLERY_LENS_PX, lx));
    ly = Math.max(0, Math.min(wrapRect.height - GALLERY_LENS_PX, ly));
    lens.style.width = `${GALLERY_LENS_PX}px`;
    lens.style.height = `${GALLERY_LENS_PX}px`;
    lens.style.left = `${lx}px`;
    lens.style.top = `${ly}px`;

    const relX = clientX - imgRect.left;
    const relY = clientY - imgRect.top;
    const bx = (relX / imgRect.width) * 100;
    const by = (relY / imgRect.height) * 100;

    lens.style.backgroundImage = `url("${img.currentSrc || img.src}")`;
    lens.style.backgroundSize = `${imgRect.width * GALLERY_LOUPE_ZOOM}px ${imgRect.height * GALLERY_LOUPE_ZOOM}px`;
    lens.style.backgroundPosition = `${bx}% ${by}%`;
    lens.classList.add('is-visible');
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const nextActive = !btn.classList.contains('is-active');
    resetGalleryZoom(wrap);
    wrap.dataset.zoomBound = '1';
    if (!nextActive) return;

    btn.classList.add('is-active');
    btn.setAttribute('aria-pressed', 'true');

    if (panModePreferred) {
      wrap.classList.add('is-pan-zoom');
      setPanTransform();
    } else {
      wrap.classList.add('is-loupe-active');
    }
  });

  wrap.addEventListener('pointerdown', (e) => {
    if (!wrap.classList.contains('is-pan-zoom') || e.target === btn) return;
    dragging = true;
    wrap.classList.add('is-dragging');
    dragStart = {
      x: e.clientX,
      y: e.clientY,
      px: wrap._galleryPan.x,
      py: wrap._galleryPan.y,
    };
    wrap.setPointerCapture(e.pointerId);
  });

  wrap.addEventListener('pointermove', (e) => {
    if (wrap.classList.contains('is-loupe-active')) {
      updateLens(e.clientX, e.clientY);
      return;
    }
    if (!dragging || !wrap.classList.contains('is-pan-zoom')) return;
    wrap._galleryPan.x = dragStart.px + (e.clientX - dragStart.x);
    wrap._galleryPan.y = dragStart.py + (e.clientY - dragStart.y);
    clampPan();
    setPanTransform();
  });

  const endDrag = () => {
    dragging = false;
    wrap.classList.remove('is-dragging');
  };

  wrap.addEventListener('pointerup', endDrag);
  wrap.addEventListener('pointercancel', endDrag);
  wrap.addEventListener('pointerleave', () => {
    lens.classList.remove('is-visible');
    endDrag();
  });
}

function openProductModal(sku) {
  const p = PRODUCTS_BY_SKU[sku];
  if (!p) return;
  openModalProduct = p;
  activeModalImage = 0;

  const modal = document.getElementById('prodModal');
  document.getElementById('prodModalSku').textContent = `# ${p.sku}`;
  document.getElementById('prodModalBadge').textContent = p.badge;
  document.getElementById('prodModalCat').textContent = `${p.categoryLabel} · ${p.type}`;
  document.getElementById('prodModalTitle').textContent = p.name;
  document.getElementById('prodModalMat').textContent = p.material;
  document.getElementById('prodModalDesc').textContent = p.description;
  document.getElementById('prodModalMetaCat').textContent = p.categoryLabel;
  document.getElementById('prodModalMetaType').textContent = p.type;
  document.getElementById('prodModalMetaSku').textContent = p.sku;
  document.getElementById('prodModalMetaMat').textContent = p.material.split(' · ')[0];
  document.getElementById('prodModalPrice').innerHTML = formatPriceBlock(p.price, p.oldPrice);

  document.getElementById('prodModalActions').innerHTML = `
    <button type="button" class="prod-btn prod-btn-cart" id="prodModalCart">Agregar al carrito</button>`;
  document.getElementById('prodModalCart').addEventListener('click', () => {
    addToCart(p.sku);
    closeProductModal();
    openCart();
  });

  const thumbsEl = document.getElementById('prodModalThumbs');
  thumbsEl.innerHTML = p.images.map((img, i) => `
    <button type="button" class="prod-modal-thumb${i === 0 ? ' active' : ''}" data-img-index="${i}" aria-label="${img.alt}">
      <img src="${img.src}" alt="" loading="lazy" onerror="this.style.display='none'">
    </button>`).join('');
  thumbsEl.querySelectorAll('.prod-modal-thumb').forEach(btn => {
    btn.addEventListener('click', () => setModalImage(parseInt(btn.dataset.imgIndex, 10)));
  });

  setModalImage(0);
  document.querySelector('.prod-modal-scroll')?.scrollTo(0, 0);
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('prod-modal-open');
  document.getElementById('prodModalClose').focus();
  bindCursorHover(modal.querySelectorAll('.prod-modal-close, .prod-modal-thumb, .prod-btn, .prod-gallery-zoom-btn'));
}

function closeProductModal() {
  const modal = document.getElementById('prodModal');
  if (!modal) return;
  resetGalleryZoom(document.getElementById('prodModalMainWrap'));
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('prod-modal-open');
  openModalProduct = null;
}

let productGridBound = false;

function bindProductCards() {
  const grid = document.getElementById('prodGrid');
  if (!grid || productGridBound) return;
  productGridBound = true;

  grid.addEventListener('click', (e) => {
    const card = e.target.closest('.prod-card');
    if (!card || !grid.contains(card)) return;

    if (e.target.closest('[data-action="cart"]')) {
      e.stopPropagation();
      addToCart(card.dataset.sku);
      return;
    }
    if (e.target.closest('[data-action]')) return;

    openProductDetail(card.dataset.sku);
  });

  grid.addEventListener('keydown', (e) => {
    const card = e.target.closest('.prod-card');
    if (!card || !grid.contains(card)) return;
    if (e.key !== 'Enter' && e.key !== ' ') return;
    if (e.target.closest('[data-action]')) return;
    e.preventDefault();
    openProductDetail(card.dataset.sku);
  });

  bindCursorHover(grid.querySelectorAll('.prod-card'));
}

function initProductModal() {
  document.getElementById('prodModalClose')?.addEventListener('click', closeProductModal);
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeProductModal);
  });
  initGalleryZoom({
    wrap: document.getElementById('prodModalMainWrap'),
    img: document.getElementById('prodModalMainImg'),
    btn: document.getElementById('prodModalZoomBtn'),
    lens: document.getElementById('prodModalLens'),
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('productMobileView')?.classList.contains('is-open')) {
      closeProductMobileView();
    } else if (document.getElementById('prodModal')?.classList.contains('is-open')) {
      closeProductModal();
    } else if (document.getElementById('cartPanel')?.classList.contains('is-open')) {
      closeCart();
    }
  });
}

/* -----------------------------------------------------------
   SHOPPING CART
   ----------------------------------------------------------- */
const CART_STORAGE_KEY = 'oasis-piercing-cart';
let cart = [];
let cartToastTimer;

function loadCart() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    cart = saved ? JSON.parse(saved) : [];
    cart = cart.filter(item => PRODUCTS_BY_SKU[item.sku]);
  } catch {
    cart = [];
  }
}

function saveCart() {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
}

function getCartCount() {
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function getCartTotal() {
  return cart.reduce((sum, item) => {
    const p = PRODUCTS_BY_SKU[item.sku];
    return sum + (p ? p.price * item.qty : 0);
  }, 0);
}

function showCartToast(msg) {
  const toast = document.getElementById('cartToast');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('is-visible');
  clearTimeout(cartToastTimer);
  cartToastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
}

function addToCart(sku, qty = 1) {
  const p = PRODUCTS_BY_SKU[sku];
  if (!p) return;
  const existing = cart.find(item => item.sku === sku);
  if (existing) existing.qty += qty;
  else cart.push({ sku, qty });
  saveCart();
  renderCart();
  showCartToast(`${p.name} agregado al carrito`);
}

function updateCartQty(sku, qty) {
  const item = cart.find(i => i.sku === sku);
  if (!item) return;
  if (qty <= 0) cart = cart.filter(i => i.sku !== sku);
  else item.qty = qty;
  saveCart();
  renderCart();
}

function removeFromCart(sku) {
  cart = cart.filter(item => item.sku !== sku);
  saveCart();
  renderCart();
}

function clearCart() {
  cart = [];
  saveCart();
  renderCart();
}

async function sendCartToWhatsApp() {
  if (!cart.length) return;
  const lineItems = cart
    .map((item) => ({ p: PRODUCTS_BY_SKU[item.sku], qty: item.qty }))
    .filter((row) => row.p);
  await submitLineItemsOrder(lineItems, 'carrito');
}

function updateCartShippingNote() {
  const note = document.getElementById('cartShippingNote');
  if (!note) return;
  const total = getCartTotal();
  if (total >= getFreeShippingMin()) {
    note.innerHTML = '🚚 <strong>¡Envío gratis en Colombia!</strong> Tu pedido califica.';
    note.classList.add('is-free');
  } else {
    const remaining = getFreeShippingMin() - total;
    note.innerHTML = `🚚 Envío gratis desde <strong>${formatPrice(getFreeShippingMin())}</strong> · Te faltan <strong>${formatPrice(remaining)}</strong>`;
    note.classList.remove('is-free');
  }
}

function renderCart() {
  const countEl = document.getElementById('navCartCount');
  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const footerEl = document.getElementById('cartFooter');
  const totalEl = document.getElementById('cartTotal');
  const count = getCartCount();

  if (countEl) {
    countEl.textContent = count;
    countEl.hidden = count === 0;
  }

  if (!itemsEl || !emptyEl || !footerEl) return;

  if (!cart.length) {
    itemsEl.innerHTML = '';
    emptyEl.hidden = false;
    footerEl.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  footerEl.hidden = false;
  if (totalEl) totalEl.textContent = formatPrice(getCartTotal());
  updateCartShippingNote();

  itemsEl.innerHTML = cart.map(item => {
    const p = PRODUCTS_BY_SKU[item.sku];
    if (!p) return '';
    const img = p.images[0];
    const imgSrc = img ? safeImageSrc(img.src) : '';
    const imgHtml = imgSrc
      ? `<img src="${imgSrc}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.textContent='${escapeHtml(p.emoji)}'">`
      : escapeHtml(p.emoji);
    return `
      <div class="cart-item" data-sku="${escapeAttr(p.sku)}">
        <div class="cart-item-img">${imgHtml}</div>
        <div class="cart-item-info">
          <div class="cart-item-sku"># ${escapeHtml(p.sku)}</div>
          <div class="cart-item-name">${escapeHtml(p.name)}</div>
          <div class="cart-item-price">${formatPrice(p.price)} c/u</div>
        </div>
        <button type="button" class="cart-item-remove" data-remove="${escapeAttr(p.sku)}" aria-label="Quitar ${escapeAttr(p.name)}">×</button>
        <div class="cart-item-qty">
          <button type="button" class="cart-qty-btn" data-qty-minus="${escapeAttr(p.sku)}" aria-label="Menos">−</button>
          <span class="cart-qty-val">${item.qty}</span>
          <button type="button" class="cart-qty-btn" data-qty-plus="${escapeAttr(p.sku)}" aria-label="Más">+</button>
          <span class="cart-item-price" style="margin-left:auto">${formatPrice(p.price * item.qty)}</span>
        </div>
      </div>`;
  }).join('');

  itemsEl.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', () => removeFromCart(btn.dataset.remove));
  });
  itemsEl.querySelectorAll('[data-qty-minus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = cart.find(i => i.sku === btn.dataset.qtyMinus);
      if (item) updateCartQty(item.sku, item.qty - 1);
    });
  });
  itemsEl.querySelectorAll('[data-qty-plus]').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = cart.find(i => i.sku === btn.dataset.qtyPlus);
      if (item) updateCartQty(item.sku, item.qty + 1);
    });
  });

  bindCursorHover(document.querySelectorAll('.cart-close, .cart-wa-btn, .cart-clear-btn, .cart-qty-btn, .cart-item-remove, .nav-cart-btn'));
}

function openCart() {
  const panel = document.getElementById('cartPanel');
  if (!panel) return;
  renderCart();
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('cart-open');
  document.getElementById('cartClose')?.focus();
}

function closeCart() {
  const panel = document.getElementById('cartPanel');
  if (!panel) return;
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('cart-open');
}

function initCart() {
  loadCart();
  renderCart();

  document.getElementById('navCartBtn')?.addEventListener('click', openCart);
  document.getElementById('cartClose')?.addEventListener('click', closeCart);
  document.querySelectorAll('[data-close-cart]').forEach(el => {
    el.addEventListener('click', closeCart);
  });
  document.getElementById('cartWaBtn')?.addEventListener('click', sendCartToWhatsApp);
  document.getElementById('cartClearBtn')?.addEventListener('click', () => {
    if (cart.length && confirm('¿Vaciar el carrito?')) clearCart();
  });

  bindCursorHover(document.querySelectorAll('.nav-cart-btn'));
}

function animateVisibleProducts() {
  document.querySelectorAll('#prodGrid .prod-card').forEach((card, i) => {
    card.classList.remove('visible');
    setTimeout(() => card.classList.add('visible'), i * 70);
  });
}

function buildPageNumbers(totalPages, current) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = new Set([1, totalPages, current, current - 1, current + 1]);
  const list = [...pages].filter(p => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const out = [];
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push('…');
    out.push(p);
  });
  return out;
}

function renderPagination(totalPages) {
  const nav = document.getElementById('prodPagination');
  if (!nav) return;

  if (totalPages <= 1) {
    nav.hidden = true;
    nav.innerHTML = '';
    return;
  }

  nav.hidden = false;
  const pages = buildPageNumbers(totalPages, currentProductPage);
  let html = `<button type="button" class="prod-page-btn" data-page="prev" aria-label="Página anterior" ${currentProductPage === 1 ? 'disabled' : ''}>‹</button>`;

  pages.forEach(p => {
    if (p === '…') {
      html += `<span class="prod-page-dots" aria-hidden="true">…</span>`;
    } else {
      html += `<button type="button" class="prod-page-btn${p === currentProductPage ? ' active' : ''}" data-page="${p}" aria-label="Página ${p}" ${p === currentProductPage ? 'aria-current="page"' : ''}>${p}</button>`;
    }
  });

  html += `<button type="button" class="prod-page-btn" data-page="next" aria-label="Página siguiente" ${currentProductPage === totalPages ? 'disabled' : ''}>›</button>`;
  nav.innerHTML = html;

  nav.querySelectorAll('.prod-page-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const val = btn.dataset.page;
      if (val === 'prev') setProductPage(currentProductPage - 1);
      else if (val === 'next') setProductPage(currentProductPage + 1);
      else setProductPage(parseInt(val, 10));
    });
  });

  bindCursorHover(nav.querySelectorAll('.prod-page-btn'));
}

/** Paginación y filtros sobre cards ya renderizadas en home.ejs (sin regenerar HTML). */
function renderProductCatalogFromDom(scroll = false) {
  const gridEl = document.getElementById('prodGrid');
  const empty = document.getElementById('prodEmpty');
  const count = document.getElementById('prodFilterCount');
  const label = CATEGORIES.find(c => c.id === activeProductFilter)?.label || activeProductFilter;
  const allCards = [...gridEl.querySelectorAll('.prod-card')];
  const filtered = allCards.filter((card) => cardMatchesFilter(card, activeProductFilter));
  const total = filtered.length;
  const perPage = getProductsPerPage();
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (currentProductPage > totalPages) currentProductPage = totalPages;
  if (currentProductPage < 1) currentProductPage = 1;

  const start = (currentProductPage - 1) * perPage;

  allCards.forEach((card) => {
    card.hidden = true;
    card.classList.remove('visible');
  });

  filtered.forEach((card, idx) => {
    const onPage = idx >= start && idx < start + perPage;
    card.hidden = !onPage;
    if (onPage) {
      setTimeout(() => card.classList.add('visible'), (idx - start) * 70);
    }
  });

  if (empty) empty.hidden = total > 0;

  if (total > 0 && count) {
    const from = start + 1;
    const to = Math.min(start + perPage, total);
    const pageInfo = totalPages > 1
      ? ` · Página <strong>${currentProductPage}</strong> de <strong>${totalPages}</strong>`
      : '';
    count.innerHTML = `Mostrando <strong>${from}–${to}</strong> de <strong>${total}</strong> producto${total !== 1 ? 's' : ''}${activeProductFilter !== 'all' ? ` en <strong>${label}</strong>` : ''}${pageInfo}`;
  } else if (count) {
    count.innerHTML = '';
  }

  bindProductCards();
  bindCursorHover(gridEl.querySelectorAll('.prod-btn'));
  renderPagination(totalPages);

  if (scroll) {
    document.getElementById('productos').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function renderProductCatalog(scroll = false) {
  const gridEl = document.getElementById('prodGrid');
  if (!gridEl) return;

  if (gridEl.dataset.ssr === 'true') {
    renderProductCatalogFromDom(scroll);
    return;
  }

  const empty = document.getElementById('prodEmpty');
  const count = document.getElementById('prodFilterCount');
  const label = CATEGORIES.find(c => c.id === activeProductFilter)?.label || activeProductFilter;
  const filtered = getFilteredProducts();
  const total = filtered.length;
  const perPage = getProductsPerPage();
  const totalPages = Math.max(1, Math.ceil(total / perPage));

  if (currentProductPage > totalPages) currentProductPage = totalPages;
  if (currentProductPage < 1) currentProductPage = 1;

  const start = (currentProductPage - 1) * perPage;
  const pageItems = filtered.slice(start, start + perPage);

  if (empty) empty.hidden = total > 0;
  gridEl.innerHTML = pageItems.map((p, i) => productCardHTML(p, start + i)).join('');

  if (total > 0 && count) {
    const from = start + 1;
    const to = start + pageItems.length;
    const pageInfo = totalPages > 1 ? ` · Página <strong>${currentProductPage}</strong> de <strong>${totalPages}</strong>` : '';
    count.innerHTML = `Mostrando <strong>${from}–${to}</strong> de <strong>${total}</strong> producto${total !== 1 ? 's' : ''}${activeProductFilter !== 'all' ? ` en <strong>${label}</strong>` : ''}${pageInfo}`;
  } else if (count) {
    count.innerHTML = '';
  }

  productGridBound = false;
  bindProductCards();
  bindCursorHover(gridEl.querySelectorAll('.prod-btn'));
  animateVisibleProducts();
  renderPagination(totalPages);

  if (scroll) {
    document.getElementById('productos').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function setProductPage(page) {
  const totalPages = Math.max(1, Math.ceil(getFilteredProducts().length / getProductsPerPage()));
  currentProductPage = Math.min(Math.max(1, page), totalPages);
  renderProductCatalog(true);
  syncCatalogToUrl({ replace: true });
}

function setProductFilter(cat, scroll = false) {
  activeProductFilter = cat;
  currentProductPage = 1;

  updateFilterButtons(cat);
  renderProductCatalog(scroll);
  syncCatalogToUrl({ replace: true });
}

function applyCatalog(catalog) {
  const dbCategories = catalog.categories || [];
  CATEGORIES = [
    { id: 'all', label: 'Todos' },
    ...dbCategories.map((c) => ({ id: c.id, label: c.label })),
  ];
  PRODUCTS = catalog.products || [];
  PRODUCTS_BY_SKU = Object.fromEntries(PRODUCTS.map((p) => [p.sku, p]));
}

function categoryCountLabel(count) {
  if (count === 1) return '1 diseño';
  return `${count} diseños`;
}

function categoryCardHTML(cat, i) {
  const desc = cat.descripcion ? cat.descripcion.trim() : '';
  const countLine = categoryCountLabel(cat.count || 0);
  const subtitle = desc ? `${countLine} · ${desc}` : countLine;
  return `
    <div class="cat-card" data-delay="${(i % 4) * 0.1}" data-cat="${escapeAttr(cat.id)}" role="button" tabindex="0" aria-label="Filtrar productos de ${escapeAttr(cat.label)}">
      <img class="cat-bg-img" src="${safeImageSrc(cat.image)}" alt="" aria-hidden="true">
      <div class="cat-grad"></div><div class="cat-shine"></div>
      <div class="cat-body">
        <div class="cat-name">${escapeHtml(cat.label)}</div>
        <div class="cat-count">${escapeHtml(subtitle)}</div>
        <span class="cat-link">Ver productos <span class="cat-link-arrow">→</span></span>
      </div>
    </div>`;
}

function renderCategoryGrid(dbCategories) {
  const grid = document.getElementById('catGrid');
  const empty = document.getElementById('catEmpty');
  const subtitle = document.getElementById('catSubtitle');
  if (!grid) return;

  const totalProducts = PRODUCTS.length;
  if (subtitle) {
    subtitle.textContent = totalProducts
      ? `Cada zona, una historia. ${totalProducts} pieza${totalProducts !== 1 ? 's' : ''} en catálogo.`
      : 'Explora nuestras colecciones de piercings.';
  }

  if (!dbCategories.length) {
    grid.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }

  if (empty) empty.hidden = true;
  grid.innerHTML = dbCategories.map(categoryCardHTML).join('');
  grid.querySelectorAll('.cat-card').forEach((el) => revealObs.observe(el));
  bindCategoryCards();
  bindCursorHover(grid.querySelectorAll('.cat-card'));
}

function bindCategoryCards() {
  document.querySelectorAll('.cat-card[data-cat]').forEach((card) => {
    if (card.dataset.bound) return;
    card.dataset.bound = '1';
    const go = () => setProductFilter(card.dataset.cat, true);
    card.addEventListener('click', go);
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go();
      }
    });
  });
}

/** Inicializa el catálogo con datos inyectados por home.ejs (servidor → CatalogService). */
function initCatalog() {
  const catalog = window.OASIS_CATALOG || {
    categories: [],
    products: [],
    productCount: 0,
    categoryNames: [],
  };

  applyCatalog(catalog);
  updateCatalogCopy();
  renderCategoryGrid(catalog.categories || []);
  initAuthGateModal();
  initCheckoutModal();
  initOrderConfirmModal();
  resumePendingCheckout();
  initProductCatalog();
}

initCatalog();

function updateCatalogCopy() {
  const count = PRODUCTS.length;
  if (!count) return;

  const label = `${count} diseño${count !== 1 ? 's' : ''}`;
  const heroSub = document.getElementById('heroSub');
  if (heroSub) {
    heroSub.textContent = `Piercings en Acero Quirúrgico 316L. ${label}, envío gratis desde ${formatPrice(getFreeShippingMin())} COP y asesoría personalizada por WhatsApp en toda Colombia.`;
  }

  const ctaSub = document.querySelector('.cta-sub');
  if (ctaSub) {
    ctaSub.textContent = `${label} · Envío gratis desde ${formatPrice(getFreeShippingMin())} COP · Asesoría gratis por WhatsApp`;
  }
}

function initProductCatalog() {
  const filtersEl = document.getElementById('prodFilters');
  if (!filtersEl) return;

  filtersEl.innerHTML = CATEGORIES.map(cat => `
    <button type="button" class="prod-filter${cat.id === 'all' ? ' active' : ''}"
            data-filter="${escapeAttr(cat.id)}" role="tab"
            aria-selected="${cat.id === 'all' ? 'true' : 'false'}"
            aria-controls="prodGrid">${escapeHtml(cat.label)}</button>
  `).join('');

  filtersEl.querySelectorAll('.prod-filter').forEach(btn => {
    btn.addEventListener('click', () => setProductFilter(btn.dataset.filter));
  });

  bindCursorHover(filtersEl.querySelectorAll('.prod-filter'));

  initProductModal();
  initProductMobileView();
  initCart();
  restoreCatalogFromUrl();
}

/* -----------------------------------------------------------
   ANIMATED COUNTERS
   ----------------------------------------------------------- */
function animCounter(el, target, duration, decimals, suffix) {
  const start = performance.now();
  const isFloat = decimals > 0;
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    const val = target * ease;
    el.textContent = (isFloat ? val.toFixed(decimals) : Math.floor(val)) + suffix;
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = (isFloat ? target.toFixed(decimals) : target) + suffix;
  }
  requestAnimationFrame(step);
}

const counterObs = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    if (el.dataset.animated) return;
    el.dataset.animated = '1';
    obs.unobserve(el);
    const target   = parseFloat(el.dataset.target);
    const suffix   = el.dataset.suffix || '';
    const decimals = parseInt(el.dataset.decimal || 0);
    setTimeout(() => animCounter(el, target, 1800, decimals, suffix), parseFloat(el.closest('[data-delay]')?.dataset.delay || 0) * 1000);
  });
}, { threshold: 0.3 });

document.querySelectorAll('[data-target]').forEach(el => counterObs.observe(el));

/* -----------------------------------------------------------
   MAGNETIC BUTTONS (subtle)
   ----------------------------------------------------------- */
document.querySelectorAll('.btn-magnetic').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const r = btn.getBoundingClientRect();
    const x = (e.clientX - r.left - r.width  / 2) * 0.18;
    const y = (e.clientY - r.top  - r.height / 2) * 0.18;
    btn.style.transform = `translate(${x}px,${y}px)`;
  });
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = '';
  });
});

/* -----------------------------------------------------------
   GSAP — solo escritorio, sin bloquear el hero
   ----------------------------------------------------------- */
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.onload = resolve;
    s.onerror = reject;
    document.body.appendChild(s);
  });
}

async function initGsapEnhancements() {
  if (window.matchMedia('(max-width: 768px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js');
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js');
  } catch {
    return;
  }

  if (typeof gsap === 'undefined') return;

  gsap.registerPlugin(ScrollTrigger);

  document.querySelectorAll('.s-title, .s-sub, .s-eyebrow').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 22 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    );
  });

  gsap.fromTo('.bento-card', { opacity: 0, y: 32, scale: 0.97 }, {
    opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'expo.out',
    stagger: { amount: 0.5, from: 'start' },
    scrollTrigger: { trigger: '.bento-grid', start: 'top 80%', once: true }
  });

  const ctaEl = document.getElementById('ctaContent');
  if (ctaEl) {
    gsap.fromTo(ctaEl, { opacity: 0, y: 40 }, {
      opacity: 1, y: 0, duration: 1, ease: 'expo.out',
      scrollTrigger: { trigger: ctaEl, start: 'top 80%', once: true }
    });
  }

  gsap.to('.orb-1', {
    yPercent: -20,
    scrollTrigger: { trigger: '.hero', scrub: 1.5 }
  });
  gsap.to('.orb-2', {
    yPercent: 15,
    scrollTrigger: { trigger: '.hero', scrub: 1.5 }
  });
  gsap.to('.hero-gems', {
    yPercent: 30,
    scrollTrigger: { trigger: '.hero', scrub: 2 }
  });
}

function scheduleGsapEnhancements() {
  const run = () => initGsapEnhancements();
  if (typeof requestIdleCallback === 'function') {
    requestIdleCallback(run, { timeout: 2500 });
  } else {
    setTimeout(run, 1200);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', scheduleGsapEnhancements);
} else {
  scheduleGsapEnhancements();
}

/* -----------------------------------------------------------
   REDUCED MOTION RESPECT
   ----------------------------------------------------------- */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.orb, .gem, .marquee-track, .test-track').forEach(el => {
    el.style.animation = 'none';
  });
}