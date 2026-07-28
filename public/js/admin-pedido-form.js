(function () {
  const form = document.getElementById('pedido-form');
  if (!form) return;

  const itemsContainer = document.getElementById('pedido-items-body');
  const totalDisplay = document.getElementById('pedido-total-display');
  const totalFooter = document.getElementById('pedido-total-footer');
  const addBtn = document.getElementById('pedido-add-item');
  const countBadge = document.getElementById('pedido-items-count');
  const summaryQty = document.getElementById('pedido-summary-qty');
  const summaryUnits = document.getElementById('pedido-summary-units');
  const clientPreview = document.getElementById('pedido-client-preview');
  const clientNameEl = document.getElementById('pedido-client-name');
  const nombreInput = document.getElementById('cliente_nombre');
  const apellidoInput = document.getElementById('cliente_apellido');
  const readOnly = form.dataset.readonly === 'true';

  function readJsonScript(id) {
    const el = document.getElementById(id);
    if (!el) return [];
    try {
      return JSON.parse(el.textContent || '[]');
    } catch {
      return [];
    }
  }

  const productos = readJsonScript('pedido-productos-data');
  const initialItems = readJsonScript('pedido-initial-items-data');

  function formatMoney(value) {
    return '$' + Number(value || 0).toLocaleString('es-CO');
  }

  function getProducto(id) {
    if (!id) return null;
    return productos.find((p) => String(p.id) === String(id)) || null;
  }

  function getRows() {
    return [...itemsContainer.querySelectorAll('.admin-pedido-line')];
  }

  function buildProductOptions(selectedId) {
    const placeholder = '<option value="">Buscar producto...</option>';
    const options = productos.map((p) => {
      const selected = String(p.id) === String(selectedId) ? ' selected' : '';
      return `<option value="${p.id}"${selected}>${p.nombre} · ${p.codigo}</option>`;
    });
    return placeholder + options.join('');
  }

  function updateClientPreview() {
    if (!clientPreview || !clientNameEl) return;
    const nombre = nombreInput?.value.trim() || '';
    const apellido = apellidoInput?.value.trim() || '';
    const full = [nombre, apellido].filter(Boolean).join(' ');

    if (full) {
      clientPreview.hidden = false;
      clientNameEl.textContent = full;
      const avatar = clientPreview.querySelector('.admin-pedido-client-avatar');
      if (avatar) avatar.textContent = nombre.charAt(0).toUpperCase() || '?';
    } else {
      clientPreview.hidden = true;
    }
  }

  function updateSummary() {
    if (readOnly) {
      const filled = initialItems.length;
      const units = initialItems.reduce((sum, item) => sum + Number(item.cantidad || 1), 0);
      const label = filled === 1 ? '1 producto' : `${filled} productos`;
      if (countBadge) countBadge.textContent = label;
      if (summaryQty) summaryQty.textContent = String(filled);
      if (summaryUnits) summaryUnits.textContent = String(units);
      return;
    }

    const rows = getRows();
    let filled = 0;
    let units = 0;

    rows.forEach((row) => {
      const select = row.querySelector('.pedido-item-producto');
      const cantidadInput = row.querySelector('.pedido-item-cantidad');
      if (select?.value) {
        filled += 1;
        units += Math.max(1, parseInt(cantidadInput?.value, 10) || 1);
      }
    });

    const label = filled === 1 ? '1 producto' : `${filled} productos`;
    if (countBadge) countBadge.textContent = label;
    if (summaryQty) summaryQty.textContent = String(filled);
    if (summaryUnits) summaryUnits.textContent = String(units);
  }

  function updateRow(row) {
    const select = row.querySelector('.pedido-item-producto');
    const cantidadInput = row.querySelector('.pedido-item-cantidad');
    const codigoEl = row.querySelector('.pedido-item-codigo');
    const precioEl = row.querySelector('.pedido-item-precio');
    const stockEl = row.querySelector('.pedido-item-stock');
    const subtotalEl = row.querySelector('.pedido-item-subtotal');

    if (!select) return;

    const producto = getProducto(select.value);
    const cantidad = Math.max(1, parseInt(cantidadInput?.value, 10) || 1);
    if (cantidadInput) cantidadInput.value = cantidad;

    row.classList.toggle('has-product', Boolean(producto));

    if (producto) {
      if (codigoEl) codigoEl.textContent = producto.codigo;
      if (precioEl) precioEl.textContent = formatMoney(producto.precio);
      if (stockEl) {
        stockEl.textContent = `${producto.stock} uds.`;
        stockEl.classList.toggle('is-low', Number(producto.stock) <= 3);
      }
      if (subtotalEl) subtotalEl.textContent = formatMoney(Number(producto.precio) * cantidad);
    } else {
      if (codigoEl) codigoEl.textContent = '—';
      if (precioEl) precioEl.textContent = '—';
      if (stockEl) {
        stockEl.textContent = '—';
        stockEl.classList.remove('is-low');
      }
      if (subtotalEl) subtotalEl.textContent = '—';
    }

    updateTotal();
    updateSummary();
  }

  function updateTotal() {
    if (readOnly) {
      const total = initialItems.reduce((sum, item) => sum + Number(item.subtotal || 0), 0);
      const formatted = formatMoney(total);
      if (totalDisplay) totalDisplay.textContent = formatted;
      if (totalFooter) totalFooter.textContent = formatted;
      return;
    }

    let total = 0;
    getRows().forEach((row) => {
      const select = row.querySelector('.pedido-item-producto');
      const cantidadInput = row.querySelector('.pedido-item-cantidad');
      const producto = getProducto(select?.value);
      if (producto) {
        const cantidad = Math.max(1, parseInt(cantidadInput?.value, 10) || 1);
        total += Number(producto.precio) * cantidad;
      }
    });

    const formatted = formatMoney(total);
    if (totalDisplay) totalDisplay.textContent = formatted;
    if (totalFooter) totalFooter.textContent = formatted;
  }

  function bindQtyStepper(row) {
    const input = row.querySelector('.pedido-item-cantidad');
    const minus = row.querySelector('[data-qty-minus]');
    const plus = row.querySelector('[data-qty-plus]');

    minus?.addEventListener('click', () => {
      input.value = Math.max(1, (parseInt(input.value, 10) || 1) - 1);
      updateRow(row);
    });

    plus?.addEventListener('click', () => {
      input.value = (parseInt(input.value, 10) || 1) + 1;
      updateRow(row);
    });
  }

  function createRow(item = {}) {
    const article = document.createElement('article');
    article.className = 'admin-pedido-line';
    article.setAttribute('role', 'listitem');

    if (readOnly) {
      const nombre = item.producto_nombre || getProducto(item.producto_id)?.nombre || '—';
      const codigo = item.producto_codigo || getProducto(item.producto_id)?.codigo || '—';
      const precio = item.precio_unitario != null
        ? item.precio_unitario
        : getProducto(item.producto_id)?.precio;
      const cantidad = item.cantidad || 1;
      const subtotal = item.subtotal != null
        ? item.subtotal
        : (precio ? Number(precio) * cantidad : 0);

      article.classList.add('has-product');
      article.innerHTML = `
        <div class="admin-pedido-line-body">
          <div class="admin-pedido-line-top">
            <h4 class="admin-pedido-line-name">${nombre}</h4>
            <span class="admin-pedido-line-subtotal">${formatMoney(subtotal)}</span>
          </div>
          <div class="admin-pedido-line-meta">
            <span class="admin-pedido-line-tag">${codigo}</span>
            <span>${precio != null ? formatMoney(precio) : '—'} c/u</span>
            <span>Cant. ${cantidad}</span>
          </div>
        </div>
      `;
      return article;
    }

    article.innerHTML = `
      <div class="admin-pedido-line-index" aria-hidden="true"></div>
      <div class="admin-pedido-line-body">
        <div class="admin-pedido-line-field">
          <label class="admin-pedido-line-label">Producto</label>
          <select class="admin-select pedido-item-producto" name="item_producto_id" aria-label="Producto">
            ${buildProductOptions(item.producto_id || '')}
          </select>
        </div>
        <div class="admin-pedido-line-details">
          <div class="admin-pedido-line-detail">
            <span class="admin-pedido-line-label">Código</span>
            <span class="pedido-item-codigo admin-pedido-line-value">—</span>
          </div>
          <div class="admin-pedido-line-detail">
            <span class="admin-pedido-line-label">Precio</span>
            <span class="pedido-item-precio admin-pedido-line-value">—</span>
          </div>
          <div class="admin-pedido-line-detail">
            <span class="admin-pedido-line-label">Stock</span>
            <span class="pedido-item-stock admin-pedido-line-value">—</span>
          </div>
        </div>
        <div class="admin-pedido-line-actions">
          <div class="admin-pedido-line-qty">
            <span class="admin-pedido-line-label">Cantidad</span>
            <div class="admin-qty-stepper">
              <button type="button" class="admin-qty-btn" data-qty-minus aria-label="Disminuir">−</button>
              <input type="number" class="admin-qty-input pedido-item-cantidad" name="item_cantidad" min="1" step="1" value="${item.cantidad || 1}" aria-label="Cantidad">
              <button type="button" class="admin-qty-btn" data-qty-plus aria-label="Aumentar">+</button>
            </div>
          </div>
          <div class="admin-pedido-line-subtotal-wrap">
            <span class="admin-pedido-line-label">Subtotal</span>
            <strong class="pedido-item-subtotal admin-pedido-line-subtotal">—</strong>
          </div>
          <button type="button" class="admin-pedido-line-remove pedido-item-remove" aria-label="Quitar producto">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
      </div>
    `;

    const select = article.querySelector('.pedido-item-producto');
    const cantidadInput = article.querySelector('.pedido-item-cantidad');
    const removeBtn = article.querySelector('.pedido-item-remove');

    select.addEventListener('change', () => updateRow(article));
    cantidadInput.addEventListener('input', () => updateRow(article));
    bindQtyStepper(article);

    removeBtn.addEventListener('click', () => {
      const rows = getRows();
      if (rows.length <= 1) {
        select.value = '';
        cantidadInput.value = '1';
        updateRow(article);
        return;
      }
      article.remove();
      reindexRows();
      updateTotal();
      updateSummary();
    });

    updateRow(article);
    return article;
  }

  function reindexRows() {
    getRows().forEach((row, i) => {
      const indexEl = row.querySelector('.admin-pedido-line-index');
      if (indexEl) indexEl.textContent = String(i + 1);
    });
  }

  function initRows() {
    itemsContainer.innerHTML = '';
    const items = initialItems.length ? initialItems : [{}];

    items.forEach((item) => {
      itemsContainer.appendChild(createRow(item));
    });

    reindexRows();
    updateTotal();
    updateSummary();
  }

  function pruneEmptyRows() {
    const rows = getRows();
    rows.forEach((row) => {
      const select = row.querySelector('.pedido-item-producto');
      if (!select?.value && rows.length > 1) {
        row.remove();
      }
    });

    if (!getRows().length) {
      itemsContainer.appendChild(createRow());
    }
    reindexRows();
  }

  function validateBeforeSubmit() {
    pruneEmptyRows();

    const filled = getRows().filter((row) => row.querySelector('.pedido-item-producto')?.value);

    if (!filled.length) {
      alert('Agrega al menos un producto al pedido.');
      return false;
    }

    for (const row of filled) {
      const cantidad = parseInt(row.querySelector('.pedido-item-cantidad')?.value, 10);
      if (!Number.isInteger(cantidad) || cantidad < 1) {
        alert('Cada producto debe tener una cantidad válida (mínimo 1).');
        return false;
      }
    }

    return true;
  }

  form.querySelectorAll('.admin-pedido-estado-option input').forEach((radio) => {
    radio.addEventListener('change', () => {
      form.querySelectorAll('.admin-pedido-estado-option').forEach((opt) => {
        opt.classList.toggle('is-selected', opt.querySelector('input')?.checked);
      });
    });
  });

  nombreInput?.addEventListener('input', updateClientPreview);
  apellidoInput?.addEventListener('input', updateClientPreview);

  addBtn?.addEventListener('click', () => {
    itemsContainer.appendChild(createRow());
    reindexRows();
    const lastSelect = itemsContainer.lastElementChild?.querySelector('.pedido-item-producto');
    lastSelect?.focus();
    updateSummary();
  });

  form.addEventListener('submit', (event) => {
    if (readOnly) return;
    if (!validateBeforeSubmit()) {
      event.preventDefault();
    }
  });

  updateClientPreview();
  initRows();
})();
