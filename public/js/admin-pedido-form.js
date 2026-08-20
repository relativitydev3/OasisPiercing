(function () {
  const form = document.getElementById('pedido-form');
  if (!form) return;

  const itemsContainer = document.getElementById('pedido-items-body');
  const itemsEmpty = document.getElementById('pedido-items-empty');
  const totalDisplay = document.getElementById('pedido-total-display');
  const totalFooter = document.getElementById('pedido-total-footer');
  const addBtn = document.getElementById('pedido-add-item');
  const countBadge = document.getElementById('pedido-items-count');
  const summaryQty = document.getElementById('pedido-summary-qty');
  const summaryUnits = document.getElementById('pedido-summary-units');
  const clientPreview = document.getElementById('pedido-client-preview');
  const clientNameEl = document.getElementById('pedido-client-name');
  const clientMetaEl = document.getElementById('pedido-client-meta');
  const nombreInput = document.getElementById('cliente_nombre');
  const apellidoInput = document.getElementById('cliente_apellido');
  const telefonoInput = document.getElementById('cliente_telefono');
  const emailInput = document.getElementById('cliente_email');
  const ccInput = document.getElementById('cliente_cc');
  const direccionInput = document.getElementById('cliente_direccion');
  const usuarioIdInput = document.getElementById('usuario_id');
  const pickClientBtn = document.getElementById('pedidoPickClient');
  const clearClientBtn = document.getElementById('pedidoClearClient');
  const readOnly = form.dataset.readonly === 'true';

  const clientPickerEl = document.getElementById('pedidoClientPicker');
  const clientPickerList = document.getElementById('clientPickerList');
  const clientPickerResults = document.getElementById('clientPickerResults');
  const clientPickerSelected = document.getElementById('clientPickerSelected');
  const clientPickerConfirm = document.getElementById('clientPickerConfirm');
  const clientFilters = {
    nombre: document.getElementById('clientFilterNombre'),
    apellido: document.getElementById('clientFilterApellido'),
    email: document.getElementById('clientFilterEmail'),
    telefono: document.getElementById('clientFilterTelefono'),
    cc: document.getElementById('clientFilterCc'),
    direccion: document.getElementById('clientFilterDireccion'),
  };

  let selectedClientId = null;

  const pickerEl = document.getElementById('pedidoProductPicker');
  const pickerSearch = document.getElementById('pedidoPickerSearch');
  const pickerGrid = document.getElementById('pedidoPickerGrid');
  const pickerResults = document.getElementById('pedidoPickerResults');
  const pickerSelected = document.getElementById('pedidoPickerSelected');
  const pickerConfirm = document.getElementById('pedidoPickerConfirm');

  const pickerSelection = new Set();

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
  const clientes = readJsonScript('pedido-clientes-data');

  const DIGITS_10_REGEX = /^\d{10}$/;

  function sanitizeDigits10(value) {
    return String(value || '').replace(/\D/g, '').slice(0, 10);
  }

  function validateOptionalDigits10(value, label) {
    const trimmed = sanitizeDigits10(value);
    if (!trimmed) return null;
    if (!DIGITS_10_REGEX.test(trimmed)) {
      return `${label} debe contener solo números y tener exactamente 10 dígitos.`;
    }
    return null;
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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

  function getUsedProductIds() {
    return new Set(
      getRows()
        .map((row) => row.dataset.productoId)
        .filter(Boolean),
    );
  }

  function toggleEmptyState() {
    if (!itemsEmpty) return;
    const hasItems = getRows().length > 0;
    itemsEmpty.hidden = hasItems || readOnly;
  }

  function updateClientPreview() {
    if (!clientPreview || !clientNameEl) return;
    const nombre = nombreInput?.value.trim() || '';
    const apellido = apellidoInput?.value.trim() || '';
    const email = emailInput?.value.trim() || '';
    const telefono = telefonoInput?.value.trim() || '';
    const full = [nombre, apellido].filter(Boolean).join(' ');
    const meta = [email, telefono].filter(Boolean).join(' · ');

    if (full) {
      clientPreview.hidden = false;
      clientNameEl.textContent = full;
      if (clientMetaEl) clientMetaEl.textContent = meta || 'Datos del cliente';
      const avatar = clientPreview.querySelector('.admin-pedido-client-avatar');
      if (avatar) avatar.textContent = nombre.charAt(0).toUpperCase() || '?';
    } else {
      clientPreview.hidden = true;
    }
  }

  function getClientById(id) {
    return clientes.find((c) => String(c.id) === String(id)) || null;
  }

  function getClientFilterValues() {
    return {
      nombre: clientFilters.nombre?.value.trim().toLowerCase() || '',
      apellido: clientFilters.apellido?.value.trim().toLowerCase() || '',
      email: clientFilters.email?.value.trim().toLowerCase() || '',
      telefono: clientFilters.telefono?.value.trim().toLowerCase() || '',
      cc: clientFilters.cc?.value.trim().toLowerCase() || '',
      direccion: clientFilters.direccion?.value.trim().toLowerCase() || '',
    };
  }

  function clientMatchesFilters(client, filters) {
    const checks = [
      ['nombre', client.nombre],
      ['apellido', client.apellido],
      ['email', client.email],
      ['telefono', client.telefono],
      ['cc', client.cc],
      ['direccion', client.direccion],
    ];
    return checks.every(([key, value]) => {
      const filter = filters[key];
      if (!filter) return true;
      return String(value || '').toLowerCase().includes(filter);
    });
  }

  function getFilteredClients() {
    const filters = getClientFilterValues();
    const hasFilter = Object.values(filters).some(Boolean);
    if (!hasFilter) return clientes;
    return clientes.filter((client) => clientMatchesFilters(client, filters));
  }

  function updateClientPickerConfirm() {
    const client = selectedClientId ? getClientById(selectedClientId) : null;
    if (clientPickerSelected) {
      clientPickerSelected.textContent = client
        ? `${[client.nombre, client.apellido].filter(Boolean).join(' ')} · ${client.email}`
        : 'Ningún cliente seleccionado';
    }
    if (clientPickerConfirm) clientPickerConfirm.disabled = !client;
  }

  function renderClientPickerList() {
    if (!clientPickerList) return;
    const filtered = getFilteredClients();

    if (clientPickerResults) {
      clientPickerResults.textContent = filtered.length
        ? `${filtered.length} cliente${filtered.length === 1 ? '' : 's'}`
        : 'Sin resultados';
    }

    if (!filtered.length) {
      clientPickerList.innerHTML = `
        <p class="admin-pedido-picker-empty">
          ${clientes.length ? 'No hay clientes que coincidan con los filtros.' : 'No hay clientes registrados con rol cliente.'}
        </p>`;
      return;
    }

    clientPickerList.innerHTML = filtered.map((client) => {
      const selected = String(selectedClientId) === String(client.id);
      const fullName = [client.nombre, client.apellido].filter(Boolean).join(' ');
      return `
        <button type="button" class="admin-client-picker-item${selected ? ' is-selected' : ''}${client.activo ? '' : ' is-inactive'}" data-client-id="${escapeHtml(client.id)}" role="option" aria-selected="${selected}">
          <span class="admin-client-picker-avatar" aria-hidden="true">${escapeHtml((client.nombre || '?').charAt(0).toUpperCase())}</span>
          <span class="admin-client-picker-body">
            <span class="admin-client-picker-name">${escapeHtml(fullName)}</span>
            <span class="admin-client-picker-email">${escapeHtml(client.email)}</span>
            <span class="admin-client-picker-meta">
              ${client.telefono ? `<span>Tel. ${escapeHtml(client.telefono)}</span>` : ''}
              ${client.cc ? `<span>CC ${escapeHtml(client.cc)}</span>` : ''}
              ${client.direccion ? `<span>${escapeHtml(client.direccion)}</span>` : ''}
            </span>
          </span>
          ${client.activo ? '' : '<span class="admin-client-picker-badge">Inactivo</span>'}
          <span class="admin-client-picker-check" aria-hidden="true">${selected ? '✓' : ''}</span>
        </button>`;
    }).join('');
  }

  function applyClientToForm(client) {
    if (!client) return;
    if (usuarioIdInput) usuarioIdInput.value = client.id;
    if (nombreInput) nombreInput.value = client.nombre || '';
    if (apellidoInput) apellidoInput.value = client.apellido || '';
    if (telefonoInput) telefonoInput.value = sanitizeDigits10(client.telefono);
    if (emailInput) emailInput.value = client.email || '';
    if (ccInput) ccInput.value = sanitizeDigits10(client.cc);
    if (direccionInput) direccionInput.value = client.direccion || '';
    if (clearClientBtn) clearClientBtn.hidden = false;
    updateClientPreview();
  }

  function clearLinkedClient() {
    if (usuarioIdInput) usuarioIdInput.value = '';
    if (clearClientBtn) clearClientBtn.hidden = true;
  }

  function openClientPicker() {
    if (readOnly || !clientPickerEl) return;
    selectedClientId = usuarioIdInput?.value || null;
    Object.values(clientFilters).forEach((input) => { if (input) input.value = ''; });
    renderClientPickerList();
    updateClientPickerConfirm();

    clientPickerEl.hidden = false;
    clientPickerEl.setAttribute('aria-hidden', 'false');
    clientPickerEl.classList.add('is-open');
    document.body.classList.add('admin-pedido-picker-open');
    clientFilters.nombre?.focus();
  }

  function closeClientPicker() {
    if (!clientPickerEl) return;
    clientPickerEl.classList.remove('is-open');
    clientPickerEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('admin-pedido-picker-open');
    selectedClientId = null;
    setTimeout(() => { clientPickerEl.hidden = true; }, 220);
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
    let units = 0;

    rows.forEach((row) => {
      const cantidadInput = row.querySelector('.pedido-item-cantidad');
      units += Math.max(1, parseInt(cantidadInput?.value, 10) || 1);
    });

    const filled = rows.length;
    const label = filled === 1 ? '1 producto' : `${filled} productos`;
    if (countBadge) countBadge.textContent = label;
    if (summaryQty) summaryQty.textContent = String(filled);
    if (summaryUnits) summaryUnits.textContent = String(units);
  }

  function renderProductThumb(producto, className) {
    if (producto?.imagen) {
      return `<img src="${escapeHtml(producto.imagen)}" alt="" class="${className}" width="72" height="72" loading="lazy">`;
    }
    return `<span class="${className} admin-pedido-no-img" aria-hidden="true">Sin foto</span>`;
  }

  function updateRow(row) {
    const productoId = row.dataset.productoId;
    const cantidadInput = row.querySelector('.pedido-item-cantidad');
    const hiddenId = row.querySelector('.pedido-item-producto-id');
    const subtotalEl = row.querySelector('.pedido-item-subtotal');
    const stockEl = row.querySelector('.pedido-item-stock');

    const producto = getProducto(productoId);
    const cantidad = Math.max(1, parseInt(cantidadInput?.value, 10) || 1);
    if (cantidadInput) cantidadInput.value = cantidad;
    if (hiddenId) hiddenId.value = productoId || '';

    row.classList.toggle('has-product', Boolean(producto));

    if (producto) {
      if (subtotalEl) subtotalEl.textContent = formatMoney(Number(producto.precio) * cantidad);
      if (stockEl) {
        stockEl.textContent = `${producto.stock} uds.`;
        stockEl.classList.toggle('is-low', Number(producto.stock) <= 3);
      }
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
      const producto = getProducto(row.dataset.productoId);
      const cantidad = Math.max(1, parseInt(row.querySelector('.pedido-item-cantidad')?.value, 10) || 1);
      if (producto) total += Number(producto.precio) * cantidad;
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
    const productoId = item.producto_id || '';
    const producto = getProducto(productoId);
    const article = document.createElement('article');
    article.className = 'admin-pedido-line';
    article.setAttribute('role', 'listitem');
    if (productoId) article.dataset.productoId = String(productoId);

    if (readOnly) {
      const nombre = item.producto_nombre || producto?.nombre || '—';
      const codigo = item.producto_codigo || producto?.codigo || '—';
      const precio = item.precio_unitario != null ? item.precio_unitario : producto?.precio;
      const cantidad = item.cantidad || 1;
      const subtotal = item.subtotal != null ? item.subtotal : (precio ? Number(precio) * cantidad : 0);
      const roProducto = producto || {
        nombre,
        codigo,
        tipo: item.tipo,
        material: item.material,
        imagen: item.imagen,
      };

      article.classList.add('has-product');
      article.innerHTML = `
        <div class="admin-pedido-line-index" aria-hidden="true"></div>
        <div class="admin-pedido-line-media">${renderProductThumb(roProducto, 'admin-pedido-line-img')}</div>
        <div class="admin-pedido-line-body">
          <div class="admin-pedido-line-top">
            <div>
              <h4 class="admin-pedido-line-name">${escapeHtml(nombre)}</h4>
              <div class="admin-pedido-line-meta">
                <span class="admin-pedido-line-tag">${escapeHtml(codigo)}</span>
                ${roProducto.tipo ? `<span>${escapeHtml(roProducto.tipo)}</span>` : ''}
                ${roProducto.material ? `<span>${escapeHtml(roProducto.material)}</span>` : ''}
              </div>
            </div>
            <span class="admin-pedido-line-subtotal">${formatMoney(subtotal)}</span>
          </div>
          <div class="admin-pedido-line-meta">
            <span>${precio != null ? formatMoney(precio) : '—'} c/u</span>
            <span>Cant. ${cantidad}</span>
          </div>
        </div>
      `;
      return article;
    }

    if (!producto) return null;

    const metaParts = [producto.tipo, producto.material].filter(Boolean);

    article.classList.add('has-product');
    article.innerHTML = `
      <div class="admin-pedido-line-index" aria-hidden="true"></div>
      <div class="admin-pedido-line-media">${renderProductThumb(producto, 'admin-pedido-line-img')}</div>
      <div class="admin-pedido-line-body">
        <input type="hidden" class="pedido-item-producto-id" name="item_producto_id" value="${escapeHtml(producto.id)}">
        <div class="admin-pedido-line-top">
          <div>
            <h4 class="admin-pedido-line-name">${escapeHtml(producto.nombre)}</h4>
            <div class="admin-pedido-line-meta">
              <span class="admin-pedido-line-tag">${escapeHtml(producto.codigo)}</span>
              ${metaParts.length ? `<span>${escapeHtml(metaParts.join(' · '))}</span>` : ''}
              ${producto.categorias ? `<span>${escapeHtml(producto.categorias)}</span>` : ''}
            </div>
          </div>
          <span class="admin-pedido-line-price">${formatMoney(producto.precio)}</span>
        </div>
        <div class="admin-pedido-line-details">
          <div class="admin-pedido-line-detail">
            <span class="admin-pedido-line-label">Stock</span>
            <span class="pedido-item-stock admin-pedido-line-value">—</span>
          </div>
          <div class="admin-pedido-line-detail admin-pedido-line-detail--qty">
            <span class="admin-pedido-line-label">Cantidad</span>
            <div class="admin-qty-stepper">
              <button type="button" class="admin-qty-btn" data-qty-minus aria-label="Disminuir">−</button>
              <input type="number" class="admin-qty-input pedido-item-cantidad" name="item_cantidad" min="1" step="1" value="${item.cantidad || 1}" aria-label="Cantidad">
              <button type="button" class="admin-qty-btn" data-qty-plus aria-label="Aumentar">+</button>
            </div>
          </div>
          <div class="admin-pedido-line-detail">
            <span class="admin-pedido-line-label">Subtotal</span>
            <strong class="pedido-item-subtotal admin-pedido-line-subtotal">—</strong>
          </div>
        </div>
        <button type="button" class="admin-pedido-line-remove pedido-item-remove" aria-label="Quitar producto">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
          <span>Quitar</span>
        </button>
      </div>
    `;

    const cantidadInput = article.querySelector('.pedido-item-cantidad');
    const removeBtn = article.querySelector('.pedido-item-remove');

    cantidadInput.addEventListener('input', () => updateRow(article));
    bindQtyStepper(article);

    removeBtn.addEventListener('click', () => {
      article.remove();
      reindexRows();
      toggleEmptyState();
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

  function addProductsToOrder(ids) {
    ids.forEach((id) => {
      const row = createRow({ producto_id: id, cantidad: 1 });
      if (row) itemsContainer.appendChild(row);
    });
    reindexRows();
    toggleEmptyState();
    updateTotal();
    updateSummary();
  }

  function initRows() {
    itemsContainer.innerHTML = '';

    if (initialItems.length) {
      initialItems.forEach((item) => {
        const row = createRow(item);
        if (row) itemsContainer.appendChild(row);
      });
    }

    reindexRows();
    toggleEmptyState();
    updateTotal();
    updateSummary();
  }

  function validateBeforeSubmit() {
    const rows = getRows();

    if (!rows.length) {
      alert('Agrega al menos un producto al pedido.');
      openPicker();
      return false;
    }

    for (const row of rows) {
      const cantidad = parseInt(row.querySelector('.pedido-item-cantidad')?.value, 10);
      if (!Number.isInteger(cantidad) || cantidad < 1) {
        alert('Cada producto debe tener una cantidad válida (mínimo 1).');
        return false;
      }
    }

    const telefonoError = validateOptionalDigits10(telefonoInput?.value, 'El teléfono');
    if (telefonoError) {
      alert(telefonoError);
      telefonoInput?.focus();
      return false;
    }

    const ccError = validateOptionalDigits10(ccInput?.value, 'La cédula');
    if (ccError) {
      alert(ccError);
      ccInput?.focus();
      return false;
    }

    return true;
  }

  function productSearchText(p) {
    return [
      p.nombre,
      p.codigo,
      p.tipo,
      p.material,
      p.categorias,
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function getAvailableProducts() {
    const used = getUsedProductIds();
    return productos.filter((p) => !used.has(String(p.id)));
  }

  function updatePickerConfirm() {
    const count = pickerSelection.size;
    if (pickerSelected) {
      pickerSelected.textContent = count === 1 ? '1 seleccionado' : `${count} seleccionados`;
    }
    if (pickerConfirm) pickerConfirm.disabled = count === 0;
  }

  function renderPickerGrid() {
    if (!pickerGrid) return;

    const query = (pickerSearch?.value || '').trim().toLowerCase();
    const available = getAvailableProducts();
    const filtered = query
      ? available.filter((p) => productSearchText(p).includes(query))
      : available;

    if (pickerResults) {
      pickerResults.textContent = filtered.length
        ? `${filtered.length} producto${filtered.length === 1 ? '' : 's'}`
        : 'Sin resultados';
    }

    if (!filtered.length) {
      pickerGrid.innerHTML = `
        <p class="admin-pedido-picker-empty">
          ${available.length ? 'No hay productos que coincidan con la búsqueda.' : 'Todos los productos activos ya están en el pedido.'}
        </p>`;
      return;
    }

    pickerGrid.innerHTML = filtered.map((p) => {
      const selected = pickerSelection.has(String(p.id));
      const meta = [p.tipo, p.material].filter(Boolean).join(' · ');
      const stockLow = Number(p.stock) <= 3;
      return `
        <button type="button" class="admin-pedido-picker-item${selected ? ' is-selected' : ''}" data-picker-id="${escapeHtml(p.id)}" role="option" aria-selected="${selected}">
          <span class="admin-pedido-picker-check" aria-hidden="true">${selected ? '✓' : ''}</span>
          <span class="admin-pedido-picker-media">${renderProductThumb(p, 'admin-pedido-picker-img')}</span>
          <span class="admin-pedido-picker-body">
            <span class="admin-pedido-picker-name">${escapeHtml(p.nombre)}</span>
            <span class="admin-pedido-picker-code">${escapeHtml(p.codigo)}</span>
            ${meta ? `<span class="admin-pedido-picker-meta">${escapeHtml(meta)}</span>` : ''}
            ${p.categorias ? `<span class="admin-pedido-picker-cat">${escapeHtml(p.categorias)}</span>` : ''}
            <span class="admin-pedido-picker-foot-row">
              <span class="admin-pedido-picker-price">${formatMoney(p.precio)}</span>
              <span class="admin-pedido-picker-stock${stockLow ? ' is-low' : ''}">${p.stock} uds</span>
            </span>
          </span>
        </button>`;
    }).join('');
  }

  function openPicker() {
    if (readOnly || !pickerEl) return;
    pickerSelection.clear();
    if (pickerSearch) pickerSearch.value = '';
    renderPickerGrid();
    updatePickerConfirm();

    pickerEl.hidden = false;
    pickerEl.setAttribute('aria-hidden', 'false');
    pickerEl.classList.add('is-open');
    document.body.classList.add('admin-pedido-picker-open');
    pickerSearch?.focus();
  }

  function closePicker() {
    if (!pickerEl) return;
    pickerEl.classList.remove('is-open');
    pickerEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('admin-pedido-picker-open');
    pickerSelection.clear();
    setTimeout(() => { pickerEl.hidden = true; }, 220);
  }

  pickerGrid?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-picker-id]');
    if (!item) return;
    const id = item.dataset.pickerId;
    if (pickerSelection.has(id)) pickerSelection.delete(id);
    else pickerSelection.add(id);
    renderPickerGrid();
    updatePickerConfirm();
  });

  pickerSearch?.addEventListener('input', renderPickerGrid);

  pickerConfirm?.addEventListener('click', () => {
    if (!pickerSelection.size) return;
    addProductsToOrder([...pickerSelection]);
    closePicker();
  });

  pickerEl?.querySelectorAll('[data-picker-close]').forEach((el) => {
    el.addEventListener('click', closePicker);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (clientPickerEl?.classList.contains('is-open')) closeClientPicker();
    else if (pickerEl?.classList.contains('is-open')) closePicker();
  });

  clientPickerList?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-client-id]');
    if (!item) return;
    selectedClientId = item.dataset.clientId;
    renderClientPickerList();
    updateClientPickerConfirm();
  });

  Object.values(clientFilters).forEach((input) => {
    input?.addEventListener('input', () => {
      renderClientPickerList();
      updateClientPickerConfirm();
    });
  });

  clientPickerConfirm?.addEventListener('click', () => {
    const client = selectedClientId ? getClientById(selectedClientId) : null;
    if (!client) return;
    applyClientToForm(client);
    closeClientPicker();
  });

  clientPickerEl?.querySelectorAll('[data-client-picker-close]').forEach((el) => {
    el.addEventListener('click', closeClientPicker);
  });

  pickClientBtn?.addEventListener('click', openClientPicker);
  clearClientBtn?.addEventListener('click', clearLinkedClient);

  form.querySelectorAll('.admin-pedido-estado-option input').forEach((radio) => {
    radio.addEventListener('change', () => {
      form.querySelectorAll('.admin-pedido-estado-option').forEach((opt) => {
        opt.classList.toggle('is-selected', opt.querySelector('input')?.checked);
      });
    });
  });

  nombreInput?.addEventListener('input', updateClientPreview);
  apellidoInput?.addEventListener('input', updateClientPreview);
  emailInput?.addEventListener('input', updateClientPreview);
  telefonoInput?.addEventListener('input', updateClientPreview);

  ccInput?.addEventListener('input', () => {
    ccInput.value = sanitizeDigits10(ccInput.value);
  });

  telefonoInput?.addEventListener('input', () => {
    telefonoInput.value = sanitizeDigits10(telefonoInput.value);
  });

  addBtn?.addEventListener('click', openPicker);

  form.addEventListener('submit', (event) => {
    if (readOnly) return;
    if (!validateBeforeSubmit()) event.preventDefault();
  });

  updateClientPreview();
  initRows();
})();
