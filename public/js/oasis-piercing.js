/* -----------------------------------------------------------
   CURSOR
   ----------------------------------------------------------- */
(function() {
  const dot  = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  let rx = 0, ry = 0, mx = 0, my = 0;
  let raf;

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
    raf = requestAnimationFrame(animate);
  }
  animate();

  // Hover state
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
const WA_PHONE = '573156819093';
const WA_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.84L.067 23.213a.75.75 0 00.921.921l5.373-1.443A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 01-5.349-1.424l-.38-.214-3.941 1.059 1.059-3.941-.214-.38A9.964 9.964 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>';

let CATEGORIES = [{ id: 'all', label: 'Todos' }];
let PRODUCTS = [];
let PRODUCTS_BY_SKU = {};
let activeModalImage = 0;
let openModalProduct = null;
let activeMobileImage = 0;

const PRODUCTS_PER_PAGE = 8;
let activeProductFilter = 'all';
let currentProductPage = 1;

const MOBILE_MQ = window.matchMedia('(max-width: 768px)');

function isMobileLayout() {
  return MOBILE_MQ.matches;
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

  const shippingLine = total >= FREE_SHIPPING_MIN
    ? '\n🚚 *Envío gratis en Colombia*'
    : `\n🚚 Envío gratis desde ${formatPrice(FREE_SHIPPING_MIN)}`;

  return `¡Hola! Quiero hacer el siguiente pedido en Oasis Piercing:\n\n${blocks.join('\n\n')}\n\n*Total pedido: ${formatPrice(total)}*${shippingLine}\n\n¿Podrían confirmar disponibilidad y forma de pago? ¡Gracias!`;
}

function buildProductWhatsAppMessage(p) {
  return buildOrderWhatsAppMessage([{ p, qty: 1 }]);
}

function refreshProductWhatsAppLinks() {
  document.querySelectorAll('#prodGrid .prod-card').forEach((card) => {
    const p = PRODUCTS_BY_SKU[card.dataset.sku];
    const link = card.querySelector('[data-action="wa"]');
    if (p && link) link.href = waLink(buildProductWhatsAppMessage(p));
  });
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
  const askMsg = buildProductWhatsAppMessage(p);
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
          <a href="${waLink(askMsg)}" class="prod-btn-wa-sm" data-action="wa" target="_blank" rel="noopener" aria-label="Preguntar por WhatsApp">${WA_ICON} WA</a>
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
  mainImg.style.display = 'block';
  mainImg.alt = img.alt || openModalProduct.name;
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

  const askMsg = buildProductWhatsAppMessage(p);
  document.getElementById('pmvActions').innerHTML = `
    <button type="button" class="prod-btn prod-btn-cart" id="pmvCart">Agregar al carrito</button>
    <a href="${waLink(askMsg)}" class="prod-btn-wa-sm" target="_blank" rel="noopener" aria-label="WhatsApp">${WA_ICON}</a>`;
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

  const askMsg = buildProductWhatsAppMessage(p);
  document.getElementById('prodModalActions').innerHTML = `
    <button type="button" class="prod-btn prod-btn-cart" id="prodModalCart">Agregar al carrito</button>
    <a href="${waLink(askMsg)}" class="prod-btn-wa-sm" target="_blank" rel="noopener" aria-label="Consultar por WhatsApp">${WA_ICON} WhatsApp</a>`;
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
  bindCursorHover(modal.querySelectorAll('.prod-modal-close, .prod-modal-thumb, .prod-btn, .prod-btn-wa-sm, .prod-gallery-zoom-btn'));
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
    const waBtn = e.target.closest('[data-action="wa"]');
    if (waBtn) {
      const p = PRODUCTS_BY_SKU[card.dataset.sku];
      if (p) waBtn.href = waLink(buildProductWhatsAppMessage(p));
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
  initGalleryZoom({
    wrap: document.getElementById('pmvHero'),
    img: document.getElementById('pmvMainImg'),
    btn: document.getElementById('pmvZoomBtn'),
    lens: document.getElementById('pmvLens'),
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
const FREE_SHIPPING_MIN = 80000;
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

function buildCartWhatsAppMessage() {
  const lineItems = cart
    .map((item) => ({ p: PRODUCTS_BY_SKU[item.sku], qty: item.qty }))
    .filter((row) => row.p);
  return buildOrderWhatsAppMessage(lineItems);
}

function updateCartShippingNote() {
  const note = document.getElementById('cartShippingNote');
  if (!note) return;
  const total = getCartTotal();
  if (total >= FREE_SHIPPING_MIN) {
    note.innerHTML = '🚚 <strong>¡Envío gratis en Colombia!</strong> Tu pedido califica.';
    note.classList.add('is-free');
  } else {
    const remaining = FREE_SHIPPING_MIN - total;
    note.innerHTML = `🚚 Envío gratis desde <strong>${formatPrice(FREE_SHIPPING_MIN)}</strong> · Te faltan <strong>${formatPrice(remaining)}</strong>`;
    note.classList.remove('is-free');
  }
}

function sendCartToWhatsApp() {
  if (!cart.length) return;
  openWhatsApp(buildCartWhatsAppMessage());
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
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));

  if (currentProductPage > totalPages) currentProductPage = totalPages;
  if (currentProductPage < 1) currentProductPage = 1;

  const start = (currentProductPage - 1) * PRODUCTS_PER_PAGE;

  allCards.forEach((card) => {
    card.hidden = true;
    card.classList.remove('visible');
  });

  filtered.forEach((card, idx) => {
    const onPage = idx >= start && idx < start + PRODUCTS_PER_PAGE;
    card.hidden = !onPage;
    if (onPage) {
      setTimeout(() => card.classList.add('visible'), (idx - start) * 70);
    }
  });

  if (empty) empty.hidden = total > 0;

  if (total > 0 && count) {
    const from = start + 1;
    const to = Math.min(start + PRODUCTS_PER_PAGE, total);
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
  const totalPages = Math.max(1, Math.ceil(total / PRODUCTS_PER_PAGE));

  if (currentProductPage > totalPages) currentProductPage = totalPages;
  if (currentProductPage < 1) currentProductPage = 1;

  const start = (currentProductPage - 1) * PRODUCTS_PER_PAGE;
  const pageItems = filtered.slice(start, start + PRODUCTS_PER_PAGE);

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
  const totalPages = Math.max(1, Math.ceil(getFilteredProducts().length / PRODUCTS_PER_PAGE));
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
  refreshProductWhatsAppLinks();
  updateCatalogCopy();
  renderCategoryGrid(catalog.categories || []);
  initProductCatalog();
}

initCatalog();

function updateCatalogCopy() {
  const count = PRODUCTS.length;
  if (!count) return;

  const label = `${count} diseño${count !== 1 ? 's' : ''}`;
  const heroSub = document.getElementById('heroSub');
  if (heroSub) {
    heroSub.textContent = `Piercings implant-grade en Titanio G23 y Acero 316L. ${label}, envío gratis desde $80.000 COP y asesoría personalizada por WhatsApp en toda Colombia.`;
  }

  const ctaSub = document.querySelector('.cta-sub');
  if (ctaSub) {
    ctaSub.textContent = `${label} · Envío gratis desde $80.000 COP · Asesoría gratis por WhatsApp`;
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
   GSAP (loaded async — enhance if available)
   ----------------------------------------------------------- */
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined') {
    // Fallback: just show hero elements
    ['heroEyebrow','heroH1','heroSub','heroActions','heroTrust'].forEach((id,i) => {
      const el = document.getElementById(id);
      if (el) {
        el.style.animation = `fadeInUp 0.9s ${i * 0.14}s both cubic-bezier(0.16,1,0.3,1)`;
      }
    });
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  // Hero entrance
  const heroTl = gsap.timeline({ defaults: { ease: 'expo.out', duration: 1 } });
  heroTl
    .to('#heroEyebrow', { opacity: 1, y: 0, duration: 0.7 })
    .to('#heroH1',      { opacity: 1, y: 0, duration: 0.9 }, '-=0.5')
    .to('#heroSub',     { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
    .to('#heroActions', { opacity: 1, y: 0, duration: 0.7 }, '-=0.5')
    .to('#heroTrust',   { opacity: 1, y: 0, duration: 0.6 }, '-=0.4');

  // Parallax on hero orbs
  gsap.to('.orb-1', {
    yPercent: -20,
    scrollTrigger: { trigger: '.hero', scrub: 1.5 }
  });
  gsap.to('.orb-2', {
    yPercent: 15,
    scrollTrigger: { trigger: '.hero', scrub: 1.5 }
  });

  // Section text reveals with split-like stagger
  document.querySelectorAll('.s-title, .s-sub, .s-eyebrow').forEach(el => {
    gsap.fromTo(el,
      { opacity: 0, y: 22 },
      {
        opacity: 1, y: 0, duration: 0.8, ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true }
      }
    );
  });

  // Bento stagger
  gsap.fromTo('.bento-card', { opacity:0, y:32, scale:0.97 }, {
    opacity:1, y:0, scale:1, duration:0.8, ease:'expo.out',
    stagger: { amount: 0.5, from: 'start' },
    scrollTrigger: { trigger: '.bento-grid', start: 'top 80%', once: true }
  });

  // CTA counter
  const ctaEl = document.getElementById('ctaContent');
  if (ctaEl) {
    gsap.fromTo(ctaEl, { opacity:0, y:40 }, {
      opacity:1, y:0, duration:1, ease:'expo.out',
      scrollTrigger: { trigger: ctaEl, start: 'top 80%', once: true }
    });
  }

  // Horizontal parallax on marquee (slow drift)
  // Already CSS animated — no extra needed

  // Scroll-linked gem rotation
  gsap.to('.hero-gems', {
    yPercent: 30,
    scrollTrigger: { trigger: '.hero', scrub: 2 }
  });
});

/* -----------------------------------------------------------
   REDUCED MOTION RESPECT
   ----------------------------------------------------------- */
if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.orb, .gem, .marquee-track, .test-track').forEach(el => {
    el.style.animation = 'none';
  });
}