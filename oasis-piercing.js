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
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const pct = (window.scrollY / max) * 100;
  document.getElementById('scroll-progress').style.width = pct + '%';
}, { passive: true });

/* -----------------------------------------------------------
   NAVBAR
   ----------------------------------------------------------- */
window.addEventListener('scroll', () => {
  document.getElementById('nav').classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* -----------------------------------------------------------
   MOBILE MENU
   ----------------------------------------------------------- */
document.getElementById('hamburger').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.add('open');
});
document.getElementById('mobileClose').addEventListener('click', () => {
  document.getElementById('mobileMenu').classList.remove('open');
});
function closeMobile() {
  document.getElementById('mobileMenu').classList.remove('open');
}

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
   PRODUCT CATALOG — filtro dinámico por categoría
   ----------------------------------------------------------- */
const WA_PHONE = '573156819093';
const WA_ICON = '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.117.549 4.107 1.51 5.84L.067 23.213a.75.75 0 00.921.921l5.373-1.443A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.956 9.956 0 01-5.349-1.424l-.38-.214-3.941 1.059 1.059-3.941-.214-.38A9.964 9.964 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>';

const CATEGORIES = [
  { id: 'all', label: 'Todos' },
  { id: 'oreja', label: 'Oreja' },
  { id: 'nariz', label: 'Nariz' },
  { id: 'ombligo', label: 'Ombligo' },
  { id: 'ceja', label: 'Ceja' },
  { id: 'labio', label: 'Labio' },
  { id: 'industrial', label: 'Industrial' },
  { id: 'lengua', label: 'Lengua' },
  { id: 'pesones', label: 'Pesones' }
];

const PRODUCT_BADGES = ['🔥 Top Ventas', '⭐ Nuevo', '💫 Premium', '✨ Clásico', '🏆 Bestseller'];
const PRODUCT_MATS = [
  'Titanio G23 implant-grade · Libre de alérgenos · Hipoalergénico',
  'Acero 316L quirúrgico · Oro PVD 18k · Sin níquel',
  'Titanio G23 · Zirconia cúbica AAA · Anodizado',
  'Acero 316L · Cristal Swarovski · 14g estándar',
  'Titanio G23 · Disco plano interno · Cierre seguro'
];
const CATEGORY_CODES = {
  oreja: 'ORE', nariz: 'NAR', ombligo: 'OMB', ceja: 'CEJ',
  labio: 'LAB', industrial: 'IND', lengua: 'LEN', pesones: 'PES'
};

const CATALOG_SPECS = [
  {
    id: 'oreja', label: 'Oreja', base: 24000,
    types: ['Helix', 'Tragus', 'Conch', 'Lóbulo', 'Rook', 'Daith', 'Forward Helix', 'Flat'],
    names: ['Helix Titanio con Cristal', 'Tragus Mini Aro Dorado', 'Conch Flor de Zirconia', 'Lóbulo Aro Huggie', 'Rook Curved Mini', 'Daith Corazón Dorado', 'Forward Helix Trío', 'Flat Barbell Cristal', 'Helix Cadena Colgante', 'Tragus Estrella Ópalo'],
    emojis: ['💎', '👂', '✨', '🌟', '💫']
  },
  {
    id: 'nariz', label: 'Nariz', base: 22000,
    types: ['Nostril', 'Septum', 'L-shape', 'Hoop', 'Clicker', 'Pin', 'Septum Falso', 'Bridge'],
    names: ['Aro Dorado con Ópalo', 'Septum Clicker Titanio', 'Stud L-shape con Perla', 'Hoop Nostril Delgado', 'Clicker Flor Zirconia', 'Pin Dorado Micro', 'Septum Herradura', 'Bridge Barbell Mini', 'Nostril Mariposa', 'Septum Luna Creciente'],
    emojis: ['🌟', '💎', '🔮', '✨', '💫']
  },
  {
    id: 'ombligo', label: 'Ombligo', base: 38000,
    types: ['Curved Barbell', 'Cadena', 'Dangle', 'Reverse', 'Joya Colgante', 'Flor', 'Corazón', 'Estrella'],
    names: ['Curved Barbell con Zirconia', 'Ombligo Cadena con Perlas', 'Dangle Cristal Largo', 'Reverse Ombligo Dorado', 'Joya Colgante Luna', 'Flor de Zirconia Ombligo', 'Corazón Rosa PVD', 'Estrella Brillante', 'Barbell Ombligo Ópalo', 'Cadena Triple Gema'],
    emojis: ['🔮', '🌊', '✨', '💫', '🌟']
  },
  {
    id: 'ceja', label: 'Ceja', base: 20000,
    types: ['Curved', 'Straight', 'Micro', 'Surface', 'Anodizado', 'Cristal', 'Disco Plano', 'Mini Hoop'],
    names: ['Curved Barbell Ceja Cristal', 'Straight Barbell Micro', 'Ceja Anodizada Violeta', 'Surface Bar Mini', 'Disco Plano Titanio', 'Ceja Gota Zirconia', 'Micro Curved Dorado', 'Mini Hoop Ceja', 'Ceja Flor Pequeña', 'Barbell Ceja Negro'],
    emojis: ['✨', '💫', '🌟', '💎', '🔮']
  },
  {
    id: 'labio', label: 'Labio', base: 21000,
    types: ['Labret', 'Monroe', 'Medusa', 'Snake Bites', 'Ashley', 'Vertical', 'Disco Interno', 'Gema'],
    names: ['Labret Disco Plano', 'Monroe con Zirconia', 'Medusa Cristal', 'Snake Bites Par Dorado', 'Ashley Barbell Mini', 'Vertical Labret Titanio', 'Labret Ópalo Rosa', 'Monroe Perla Cultivada', 'Labret Corazón Mini', 'Medusa Estrella'],
    emojis: ['🌟', '💋', '✨', '💫', '💎']
  },
  {
    id: 'industrial', label: 'Industrial', base: 36000,
    types: ['Barbell', 'Gemas', 'Minimalista', 'Opalitos', 'Cadenas', 'Cristal', 'Negro', 'Dorado'],
    names: ['Industrial Bar Minimalista', 'Industrial con Opalitos', 'Bar Industrial Cristal', 'Industrial Negro Mate', 'Industrial Dorado PVD', 'Industrial Gemas Triple', 'Barbell Industrial 38mm', 'Industrial Luna y Sol', 'Industrial Cadena Mini', 'Industrial Zirconia Central'],
    emojis: ['⚡', '🔥', '💎', '✨', '🌟']
  },
  {
    id: 'lengua', label: 'Lengua', base: 22000,
    types: ['Straight Barbell', 'Gem Barbell', 'Anodizado', 'Bioflex', 'Bolas Cristal', 'UV Reactive', 'Ópalo', 'Dorado PVD'],
    names: ['Barbell Lengua Titanio G23', 'Barbell con Bolas de Zirconia', 'Barbell Anodizado Arcoíris', 'Barbell Bioflex Transparente', 'Barbell UV Reactive Neon', 'Barbell Bolas de Ópalo', 'Barbell Lengua Dorado PVD', 'Barbell Mini 12g Delgado', 'Barbell con Diamante Sintético', 'Barbell Lengua Negro Anodizado'],
    emojis: ['👅', '💎', '✨', '🔮', '🌟']
  },
  {
    id: 'pesones', label: 'Pesones', base: 32000,
    types: ['Barbell', 'Aro', 'Escudo', 'Gem Barbell', 'Captive Bead', 'Clicker', 'Flor', 'Corazón'],
    names: ['Barbell Pesón Titanio', 'Aro Pesón Acero 316L', 'Escudo Pesón con Gema', 'Barbell Pesón Zirconia', 'Aro Captive Bead Pesón', 'Barbell Pesón Oro Rosa PVD', 'Escudo Flor de Cristal', 'Barbell Pesón 14g Estándar', 'Aro Pesón Clicker', 'Barbell Pesón Estilo Industrial'],
    emojis: ['💎', '✨', '🔴', '🌟', '💫']
  }
];

function buildProductImages(sku, emoji) {
  return [1, 2, 3].map(n => ({
    src: `https://picsum.photos/seed/${sku}-v${n}/900/600`,
    alt: `Vista ${n} — ${sku}`,
    fallback: emoji
  }));
}

function buildProductDescription(label, type, material, name) {
  return `${name} de la colección ${label}. Diseño tipo ${type} elaborado en ${material.split(' · ')[0]}. Acabado premium, empaque estéril individual y guía de cuidados incluida. Envío seguro a todo Colombia con asesoría personalizada por WhatsApp.`;
}

function buildProducts() {
  const items = [];
  CATALOG_SPECS.forEach(spec => {
    for (let i = 0; i < 20; i++) {
      const price = spec.base + (i % 5) * 2500 + Math.floor(i / 5) * 1800;
      const baseName = spec.names[i % spec.names.length];
      const edition = i >= spec.names.length ? ` Ed. ${i + 1}` : '';
      const name = baseName + edition;
      const type = spec.types[i % spec.types.length];
      const material = PRODUCT_MATS[i % PRODUCT_MATS.length];
      const emoji = spec.emojis[i % spec.emojis.length];
      const sku = `OP-${CATEGORY_CODES[spec.id]}-${String(i + 1).padStart(3, '0')}`;
      items.push({
        sku,
        category: spec.id,
        categoryLabel: spec.label,
        type,
        badge: PRODUCT_BADGES[i % PRODUCT_BADGES.length],
        emoji,
        sub: `${spec.label} · ${type}`,
        name,
        material,
        description: buildProductDescription(spec.label, type, material, name),
        images: buildProductImages(sku, emoji),
        price,
        oldPrice: Math.round(price * 1.32)
      });
    }
  });
  return items;
}

const PRODUCTS = buildProducts();
const PRODUCTS_BY_SKU = Object.fromEntries(PRODUCTS.map(p => [p.sku, p]));
let activeModalImage = 0;
let openModalProduct = null;

const PRODUCTS_PER_PAGE = 8;
let activeProductFilter = 'all';
let currentProductPage = 1;

function formatPrice(n) {
  return '$' + n.toLocaleString('es-CO');
}

function waLink(text) {
  return `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(text)}`;
}

function getProductImageUrls(p) {
  return (p.images || []).map(img => img.src).filter(Boolean);
}

function buildProductWhatsAppMessage(p) {
  const img = p.images[0]?.src || '';
  let msg = `Hola! Me interesa ${p.name} (${p.sku})\n cantidad: 1 — precio unidad ${formatPrice(p.price)}\ntotal de 1: ${formatPrice(p.price)}`;
  if (img) msg += `\nurl imagen: ${img}`;
  msg += '\n\n¿Tienen disponibilidad?';
  return msg;
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

function getFilteredProducts() {
  return activeProductFilter === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeProductFilter);
}

function productImgHTML(img, p, className = '') {
  const fallback = `<span class="prod-img-fallback" hidden>${p.emoji}</span>`;
  return `<img class="${className}" src="${img.src}" alt="${img.alt}" loading="lazy" data-fallback="${p.emoji}" onerror="this.style.display='none';this.nextElementSibling.hidden=false;this.parentElement.classList.add('has-fallback')">${fallback}`;
}

function productCardHTML(p, i) {
  const askMsg = buildProductWhatsAppMessage(p);
  const mainImg = p.images[0];
  return `
    <article class="prod-card" data-sku="${p.sku}" data-category="${p.category}" data-delay="${(i % 4) * 0.1}" tabindex="0" role="button" aria-label="Ver detalles de ${p.name}">
      <div class="prod-img">
        <span class="prod-badge">${p.badge}</span>
        ${productImgHTML(mainImg, p)}
        <span class="prod-card-hint">Ver detalles</span>
      </div>
      <div class="prod-body">
        <div class="prod-sku"># ${p.sku}</div>
        <div class="prod-cat">${p.categoryLabel} · ${p.type}</div>
        <div class="prod-name">${p.name}</div>
        <div class="prod-mat">${p.material}</div>
        <p class="prod-desc">${p.description}</p>
        <div class="prod-price">${formatPrice(p.price)} <del>${formatPrice(p.oldPrice)}</del></div>
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

function setModalImage(index) {
  if (!openModalProduct) return;
  const imgs = openModalProduct.images;
  activeModalImage = Math.max(0, Math.min(index, imgs.length - 1));
  const img = imgs[activeModalImage];
  const mainImg = document.getElementById('prodModalMainImg');
  const fallback = document.getElementById('prodModalMainFallback');
  if (!mainImg || !fallback) return;

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
  document.getElementById('prodModalPrice').innerHTML = `${formatPrice(p.price)} <del>${formatPrice(p.oldPrice)}</del>`;

  const askMsg = buildProductWhatsAppMessage(p);
  document.getElementById('prodModalActions').innerHTML = `
    <button type="button" class="prod-btn prod-btn-cart" id="prodModalCart">Agregar al carrito</button>
    <a href="${waLink(askMsg)}" class="prod-btn-wa-sm" target="_blank" rel="noopener">${WA_ICON} WhatsApp</a>`;
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
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.classList.add('prod-modal-open');
  document.getElementById('prodModalClose').focus();
  bindCursorHover(modal.querySelectorAll('.prod-modal-close, .prod-modal-thumb, .prod-btn, .prod-btn-wa-sm'));
}

function closeProductModal() {
  const modal = document.getElementById('prodModal');
  if (!modal) return;
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('prod-modal-open');
  openModalProduct = null;
}

function bindProductCards() {
  document.querySelectorAll('#prodGrid .prod-card').forEach(card => {
    const open = () => openProductModal(card.dataset.sku);
    card.addEventListener('click', e => {
      if (e.target.closest('[data-action]')) return;
      open();
    });
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        if (e.target.closest('[data-action]')) return;
        e.preventDefault();
        open();
      }
    });
    const cartBtn = card.querySelector('[data-action="cart"]');
    if (cartBtn) {
      cartBtn.addEventListener('click', e => {
        e.stopPropagation();
        addToCart(card.dataset.sku);
      });
    }
  });
  bindCursorHover(document.querySelectorAll('#prodGrid .prod-card'));
}

function initProductModal() {
  document.getElementById('prodModalClose')?.addEventListener('click', closeProductModal);
  document.querySelectorAll('[data-close-modal]').forEach(el => {
    el.addEventListener('click', closeProductModal);
  });
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('prodModal')?.classList.contains('is-open')) closeProductModal();
    else if (document.getElementById('cartPanel')?.classList.contains('is-open')) closeCart();
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
  const blocks = cart.map((item, i) => {
    const p = PRODUCTS_BY_SKU[item.sku];
    if (!p) return '';
    const sub = p.price * item.qty;
    const img = p.images[0]?.src || '';
    let block = `${i + 1}. ${p.name} (${p.sku})\n cantidad: ${item.qty} — precio unidad ${formatPrice(p.price)}\ntotal de ${item.qty}: ${formatPrice(sub)}`;
    if (img) block += `\nurl imagen: ${img}`;
    return block;
  }).filter(Boolean);

  const total = getCartTotal();
  const shippingLine = total >= FREE_SHIPPING_MIN
    ? '\n🚚 *Envío gratis en Colombia*'
    : `\n🚚 Envío gratis desde ${formatPrice(FREE_SHIPPING_MIN)}`;

  return `¡Hola! Quiero hacer el siguiente pedido en Oasis Piercing:\n\n${blocks.join('\n\n')}\n\n*Total pedido: ${formatPrice(total)}*${shippingLine}\n\n¿Podrían confirmar disponibilidad y forma de pago? ¡Gracias!`;
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
    const imgHtml = img
      ? `<img src="${img.src}" alt="" loading="lazy" onerror="this.style.display='none';this.parentElement.textContent='${p.emoji}'">`
      : p.emoji;
    return `
      <div class="cart-item" data-sku="${p.sku}">
        <div class="cart-item-img">${imgHtml}</div>
        <div class="cart-item-info">
          <div class="cart-item-sku"># ${p.sku}</div>
          <div class="cart-item-name">${p.name}</div>
          <div class="cart-item-price">${formatPrice(p.price)} c/u</div>
        </div>
        <button type="button" class="cart-item-remove" data-remove="${p.sku}" aria-label="Quitar ${p.name}">×</button>
        <div class="cart-item-qty">
          <button type="button" class="cart-qty-btn" data-qty-minus="${p.sku}" aria-label="Menos">−</button>
          <span class="cart-qty-val">${item.qty}</span>
          <button type="button" class="cart-qty-btn" data-qty-plus="${p.sku}" aria-label="Más">+</button>
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

function renderProductCatalog(scroll = false) {
  const gridEl = document.getElementById('prodGrid');
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

  if (!gridEl) return;

  empty.hidden = total > 0;
  gridEl.innerHTML = pageItems.map((p, i) => productCardHTML(p, start + i)).join('');

  if (total > 0) {
    const from = start + 1;
    const to = start + pageItems.length;
    const pageInfo = totalPages > 1 ? ` · Página <strong>${currentProductPage}</strong> de <strong>${totalPages}</strong>` : '';
    count.innerHTML = `Mostrando <strong>${from}–${to}</strong> de <strong>${total}</strong> producto${total !== 1 ? 's' : ''}${activeProductFilter !== 'all' ? ` en <strong>${label}</strong>` : ''}${pageInfo}`;
  } else {
    count.innerHTML = '';
  }

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
}

function setProductFilter(cat, scroll = false) {
  activeProductFilter = cat;
  currentProductPage = 1;

  document.querySelectorAll('.prod-filter').forEach(btn => {
    const on = btn.dataset.filter === cat;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', on ? 'true' : 'false');
  });

  renderProductCatalog(scroll);
}

function initProductCatalog() {
  const filtersEl = document.getElementById('prodFilters');
  if (!filtersEl) return;

  filtersEl.innerHTML = CATEGORIES.map(cat => `
    <button type="button" class="prod-filter${cat.id === 'all' ? ' active' : ''}"
            data-filter="${cat.id}" role="tab"
            aria-selected="${cat.id === 'all' ? 'true' : 'false'}"
            aria-controls="prodGrid">${cat.label}</button>
  `).join('');

  filtersEl.querySelectorAll('.prod-filter').forEach(btn => {
    btn.addEventListener('click', () => setProductFilter(btn.dataset.filter));
  });

  bindCursorHover(filtersEl.querySelectorAll('.prod-filter'));

  document.querySelectorAll('.cat-card[data-cat]').forEach(card => {
    const go = () => setProductFilter(card.dataset.cat, true);
    card.addEventListener('click', go);
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
    });
  });

  initProductModal();
  initCart();
  setProductFilter('all');
}

initProductCatalog();

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
   FAQ ACCORDION
   ----------------------------------------------------------- */
function toggleFaq(btn) {
  const item = btn.closest('.faq-item');
  const isOpen = item.classList.contains('open');
  // Close all
  document.querySelectorAll('.faq-item.open').forEach(i => {
    i.classList.remove('open');
    i.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
  }
}

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