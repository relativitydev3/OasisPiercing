(function () {
  const root = document.getElementById('adminDashboard');
  if (!root) return;

  const refreshUrl = root.dataset.refreshUrl;
  const ventasUrl = root.dataset.ventasUrl;
  const refreshBtn = document.getElementById('dashboardRefreshBtn');
  const updatedAtEl = document.getElementById('dashboardUpdatedAt');
  const ventasFilter = document.getElementById('dashboardVentasFilter');
  const ventasDesdeInput = document.getElementById('ventasDesde');
  const ventasHastaInput = document.getElementById('ventasHasta');
  const ventasErrorEl = document.getElementById('dashboardVentasError');
  const ventasSubEl = document.getElementById('dashboardVentasSub');

  const initialMeta = window.ADMIN_DASHBOARD?.meta || {};
  let ventasRange = {
    desde: initialMeta.ventasDesde || '',
    hasta: initialMeta.ventasHasta || '',
  };

  const ESTADO_LABELS = {
    pendiente: 'Pendiente',
    confirmado: 'Confirmado',
    en_preparacion: 'En preparación',
    enviado: 'Enviado',
    entregado: 'Entregado',
    cancelado: 'Cancelado',
  };

  function formatMoney(n) {
    return '$' + Math.round(Number(n) || 0).toLocaleString('es-CO');
  }

  function formatShortMoney(n) {
    const v = Number(n) || 0;
    if (v >= 1000) return '$' + Math.round(v / 1000) + 'k';
    return '$' + v;
  }

  function formatDateTime(iso) {
    try {
      return new Date(iso).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
    } catch {
      return iso;
    }
  }

  function animateCount(el, target, prefix = '') {
    if (!el || el.dataset.animated === '1') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      el.textContent = prefix + target.toLocaleString('es-CO');
      return;
    }

    el.dataset.animated = '1';
    const start = performance.now();
    const from = 0;
    const duration = 900;

    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      const val = Math.round(from + (target - from) * eased);
      el.textContent = prefix + val.toLocaleString('es-CO');
      if (p < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  }

  function initCounters() {
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const prefix = el.dataset.prefix || '';
      el.dataset.animated = '';
      animateCount(el, target, prefix);
    });
  }

  function formatDayKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  function todayKey() {
    return formatDayKey(new Date());
  }

  function setVentasError(message) {
    if (!ventasErrorEl) return;
    if (!message) {
      ventasErrorEl.hidden = true;
      ventasErrorEl.textContent = '';
      return;
    }
    ventasErrorEl.hidden = false;
    ventasErrorEl.textContent = message;
  }

  function syncVentasInputs() {
    if (ventasDesdeInput) ventasDesdeInput.value = ventasRange.desde;
    if (ventasHastaInput) ventasHastaInput.value = ventasRange.hasta;
    const today = todayKey();
    if (ventasHastaInput) ventasHastaInput.max = today;
    if (ventasDesdeInput) ventasDesdeInput.max = ventasRange.hasta || today;
  }

  function buildQueryString(params) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) qs.set(key, value);
    });
    const str = qs.toString();
    return str ? `?${str}` : '';
  }

  function updateVentasUrl() {
    const qs = buildQueryString({ desde: ventasRange.desde, hasta: ventasRange.hasta });
    const next = `${window.location.pathname}${qs}`;
    if (window.location.pathname + window.location.search !== next) {
      window.history.replaceState(null, '', next);
    }
  }

  function renderVentasSubtitle(meta) {
    if (!ventasSubEl || !meta) return;
    const pedidos = meta.ventasPedidos || 0;
    ventasSubEl.textContent = `${meta.ventasDesde} al ${meta.ventasHasta} · ${formatMoney(meta.ventasTotal)} · ${pedidos} pedido${pedidos === 1 ? '' : 's'}`;
  }

  function renderVentasChart(ventasPorDia, maxVentasDia) {
    const chart = document.getElementById('dashboardVentasChart');
    const wrap = chart?.closest('.admin-dash-chart-wrap');
    if (!chart) return;

    const count = ventasPorDia.length;
    const scroll = count > 14;
    chart.classList.toggle('admin-dash-chart--scroll', scroll);
    if (!scroll) {
      chart.style.setProperty('--chart-cols', String(count));
    } else {
      chart.style.removeProperty('--chart-cols');
    }

    chart.innerHTML = ventasPorDia.map((d) => {
      const pct = maxVentasDia > 0 ? Math.round((d.total / maxVentasDia) * 100) : 0;
      return `
        <div class="admin-dash-bar-wrap" title="${escapeHtml(d.label)}: ${formatMoney(d.total)}">
          <div class="admin-dash-bar" style="--h: ${pct}%;" data-value="${d.total}"></div>
          <span class="admin-dash-bar-label">${escapeHtml(d.label)}</span>
          <span class="admin-dash-bar-val">${formatShortMoney(d.total)}</span>
        </div>`;
    }).join('');

    if (wrap) {
      wrap.classList.toggle('is-scroll', scroll);
    }
  }

  function applyPreset(preset) {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const hasta = formatDayKey(today);
    let desdeDate = new Date(today);

    if (preset === 'month') {
      desdeDate = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0);
    } else {
      const days = preset === '30' ? 30 : 7;
      desdeDate.setDate(today.getDate() - (days - 1));
    }

    ventasRange = { desde: formatDayKey(desdeDate), hasta };
    syncVentasInputs();
    loadVentasChart();
  }

  async function loadVentasChart() {
    if (!ventasUrl) return;
    setVentasError('');
    ventasFilter?.classList.add('is-loading');

    try {
      const qs = buildQueryString({ desde: ventasRange.desde, hasta: ventasRange.hasta });
      const res = await fetch(`${ventasUrl}${qs}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        throw new Error(json.message || 'No se pudo cargar el rango');
      }

      ventasRange = {
        desde: json.meta.ventasDesde,
        hasta: json.meta.ventasHasta,
      };
      syncVentasInputs();
      renderVentasChart(json.ventasPorDia, json.maxVentasDia);
      renderVentasSubtitle(json.meta);
      updateVentasUrl();
    } catch (err) {
      setVentasError(err.message || 'Error al filtrar ingresos');
    } finally {
      ventasFilter?.classList.remove('is-loading');
    }
  }

  function escapeHtml(str) {
    return String(str ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function formatDateShort(iso) {
    try {
      return new Date(iso).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return '';
    }
  }

  /* ——— Drill-down modal ——— */
  const drillEl = document.getElementById('adminDashDrill');
  const drillTitle = document.getElementById('adminDashDrillTitle');
  const drillSub = document.getElementById('adminDashDrillSub');
  const drillBody = document.getElementById('adminDashDrillBody');
  const drillFoot = document.getElementById('adminDashDrillFoot');
  const drillLink = document.getElementById('adminDashDrillLink');

  function openDrill() {
    if (!drillEl) return;
    drillEl.hidden = false;
    drillEl.setAttribute('aria-hidden', 'false');
    drillEl.classList.add('is-open');
    document.body.classList.add('admin-dash-drill-open');
    drillEl.querySelector('.admin-dash-drill-close')?.focus();
  }

  function closeDrill() {
    if (!drillEl) return;
    drillEl.classList.remove('is-open');
    drillEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('admin-dash-drill-open');
    setTimeout(() => { drillEl.hidden = true; }, 280);
  }

  function renderDrillProductos(items, alert) {
    if (!items.length) {
      return '<p class="admin-dash-drill-empty">No hay productos para mostrar.</p>';
    }
    return `
      <div class="admin-dash-drill-grid">
        ${items.map((p) => `
          <a href="/admin/productos/${p.id}/editar" class="admin-dash-drill-product${alert ? ' is-alert' : ''}">
            <div class="admin-dash-drill-product-img">
              ${p.imagen
                ? `<img src="${escapeHtml(p.imagen)}" alt="" width="120" height="120" loading="lazy">`
                : '<span class="admin-dash-drill-no-img">Sin foto</span>'}
            </div>
            <div class="admin-dash-drill-product-body">
              <p class="admin-dash-drill-product-name">${escapeHtml(p.nombre)}</p>
              <p class="admin-dash-drill-product-code">${escapeHtml(p.codigo)}</p>
              ${p.tipo ? `<p class="admin-dash-drill-product-meta">${escapeHtml(p.tipo)} · ${escapeHtml(p.material || '')}</p>` : ''}
              <div class="admin-dash-drill-product-foot">
                <span class="admin-price">${formatMoney(p.precio)}</span>
                <span class="admin-dash-drill-stock${p.stock <= 5 ? ' is-low' : ''}">${p.stock} uds</span>
              </div>
            </div>
          </a>`).join('')}
      </div>`;
  }

  function renderDrillPedidos(items) {
    if (!items.length) {
      return '<p class="admin-dash-drill-empty">No hay pedidos para mostrar.</p>';
    }
    return `
      <div class="admin-table-wrap admin-table-wrap--flush">
        <div class="admin-table-scroll">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Items</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody>
              ${items.map((p) => `
                <tr>
                  <td><a href="/admin/pedidos/${p.id}" class="admin-product-code">${escapeHtml(p.numero_pedido)}</a></td>
                  <td>${escapeHtml(p.cliente_nombre)} ${escapeHtml(p.cliente_apellido)}</td>
                  <td>${p.total_items || 0}</td>
                  <td><span class="admin-price">${formatMoney(p.total)}</span></td>
                  <td><span class="admin-badge admin-badge-pedido admin-badge-pedido--${escapeHtml(p.estado)}">${escapeHtml(ESTADO_LABELS[p.estado] || p.estado)}</span></td>
                  <td>${formatDateShort(p.created_at)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>`;
  }

  function renderDrillCategorias(items) {
    if (!items.length) {
      return '<p class="admin-dash-drill-empty">No hay categorías activas.</p>';
    }
    return `
      <div class="admin-dash-drill-cats">
        ${items.map((c) => `
          <a href="/admin/categorias/${c.id}" class="admin-dash-drill-cat">
            <img src="${escapeHtml(c.imagen)}" alt="" class="admin-dash-drill-cat-img" width="64" height="64" loading="lazy">
            <div>
              <p class="admin-dash-drill-cat-name">${escapeHtml(c.nombre)}</p>
              <p class="admin-dash-drill-cat-meta">${c.productos} producto${c.productos === 1 ? '' : 's'}</p>
            </div>
          </a>`).join('')}
      </div>`;
  }

  function renderDrillUsuarios(items) {
    if (!items.length) {
      return '<p class="admin-dash-drill-empty">No hay usuarios activos.</p>';
    }
    return `
      <ul class="admin-dash-drill-users">
        ${items.map((u) => `
          <li>
            <a href="/admin/usuarios/${u.id}" class="admin-dash-drill-user">
              <span class="admin-dash-drill-user-avatar">${escapeHtml((u.nombre || 'U').charAt(0))}</span>
              <span class="admin-dash-drill-user-body">
                <span class="admin-dash-drill-user-name">${escapeHtml(u.nombre)} ${escapeHtml(u.apellido)}</span>
                <span class="admin-dash-drill-user-meta">${escapeHtml(u.email)} · ${escapeHtml(u.rol_nombre)}</span>
              </span>
            </a>
          </li>`).join('')}
      </ul>`;
  }

  function renderDrillTicket(detail) {
    const st = detail.stats || {};
    return `
      <div class="admin-dash-drill-stats">
        <div class="admin-stat"><p class="admin-stat-value">${formatMoney(st.promedio)}</p><p class="admin-stat-label">Promedio</p></div>
        <div class="admin-stat"><p class="admin-stat-value">${formatMoney(st.minimo)}</p><p class="admin-stat-label">Mínimo</p></div>
        <div class="admin-stat"><p class="admin-stat-value">${formatMoney(st.maximo)}</p><p class="admin-stat-label">Máximo</p></div>
        <div class="admin-stat"><p class="admin-stat-value">${st.total || 0}</p><p class="admin-stat-label">Pedidos base</p></div>
      </div>
      <h3 class="admin-dash-drill-section-title">Pedidos de referencia</h3>
      ${renderDrillPedidos(detail.items || [])}`;
  }

  function renderDrillContent(detail) {
    switch (detail.view) {
      case 'productos': return renderDrillProductos(detail.items, detail.alert);
      case 'pedidos': return renderDrillPedidos(detail.items);
      case 'categorias': return renderDrillCategorias(detail.items);
      case 'usuarios': return renderDrillUsuarios(detail.items);
      case 'ticket': return renderDrillTicket(detail);
      default: return '<p class="admin-dash-drill-empty">Sin datos.</p>';
    }
  }

  async function loadDrill(type, estado) {
    if (!drillEl || !drillBody) return;

    openDrill();
    drillTitle.textContent = 'Cargando…';
    drillSub.textContent = '';
    drillBody.innerHTML = '<p class="admin-dash-drill-loading">Cargando detalle…</p>';
    drillFoot.hidden = true;

    const qs = estado ? `?estado=${encodeURIComponent(estado)}` : '';
    try {
      const res = await fetch(`/admin/dashboard/detail/${encodeURIComponent(type)}${qs}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('Error');
      const json = await res.json();
      const detail = json.detail;
      drillTitle.textContent = detail.title;
      drillSub.textContent = detail.subtitle || '';
      drillBody.innerHTML = renderDrillContent(detail);
      if (detail.linkAll && drillLink && drillFoot) {
        drillLink.href = detail.linkAll;
        drillFoot.hidden = false;
      }
    } catch {
      drillTitle.textContent = 'Error';
      drillSub.textContent = '';
      drillBody.innerHTML = '<p class="admin-dash-drill-empty">No se pudo cargar el detalle. Intenta de nuevo.</p>';
    }
  }

  root.addEventListener('click', (e) => {
    const drillBtn = e.target.closest('[data-drill]');
    if (!drillBtn || drillBtn.disabled || drillBtn.getAttribute('aria-disabled') === 'true') return;
    const type = drillBtn.dataset.drill;
    const estado = drillBtn.dataset.estado || null;
    if (type) loadDrill(type, estado);
  });

  drillEl?.querySelectorAll('[data-drill-close]').forEach((el) => {
    el.addEventListener('click', closeDrill);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drillEl?.classList.contains('is-open')) closeDrill();
  });

  function renderEstados(pedidosPorEstado, maxEstado) {
    const list = document.getElementById('dashboardEstadosList');
    if (!list) return;

    list.innerHTML = pedidosPorEstado.map((e) => {
      const pct = maxEstado > 0 ? Math.round((e.count / maxEstado) * 100) : 0;
      const disabled = e.count ? '' : ' aria-disabled="true"';
      return `
        <li class="admin-dash-estado-item admin-dash-estado-item--click" data-drill="pedidos-estado" data-estado="${e.value}"${disabled}>
          <div class="admin-dash-estado-head">
            <span class="admin-badge admin-badge-pedido admin-badge-pedido--${e.value}">${e.label}</span>
            <strong>${e.count}</strong>
          </div>
          <div class="admin-dash-estado-track"><span style="width: ${pct}%;"></span></div>
        </li>`;
    }).join('');
  }

  function renderPedidos(pedidos) {
    const tbody = document.querySelector('#dashboardPedidosTable tbody');
    if (!tbody) return;

    tbody.innerHTML = pedidos.map((p) => {
      const fecha = new Date(p.created_at);
      const fechaStr = fecha.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
      const estadoLabel = ESTADO_LABELS[p.estado] || p.estado;
      return `
        <tr>
          <td><a href="/admin/pedidos/${p.id}" class="admin-product-code">${p.numero_pedido}</a></td>
          <td><span class="admin-product-name">${p.cliente_nombre} ${p.cliente_apellido}</span></td>
          <td><span class="admin-price">${formatMoney(p.total)}</span></td>
          <td><span class="admin-badge admin-badge-pedido admin-badge-pedido--${p.estado}">${estadoLabel}</span></td>
          <td>${fechaStr}</td>
        </tr>`;
    }).join('');
  }

  function renderTop(topProductos) {
    const list = document.getElementById('dashboardTopList');
    if (!list) return;

    list.innerHTML = topProductos.map((p, i) => `
      <li class="admin-dash-rank-item">
        <span class="admin-dash-rank-pos">${i + 1}</span>
        <div class="admin-dash-rank-body">
          <p class="admin-dash-rank-name">${p.nombre}</p>
          <p class="admin-dash-rank-meta">${p.unidades} u · ${formatMoney(p.ingresos)}</p>
        </div>
      </li>`).join('');
  }

  function renderStock(stockBajo) {
    const list = document.getElementById('dashboardStockList');
    if (!list) return;

    list.innerHTML = stockBajo.map((p) => `
      <li class="admin-dash-stock-item">
        <a href="/admin/productos/${p.id}/editar" class="admin-dash-stock-link">
          ${p.imagen ? `<img src="${escapeHtml(p.imagen)}" alt="" class="admin-dash-stock-thumb" width="32" height="32" loading="lazy">` : ''}
          <span class="admin-dash-stock-name">${escapeHtml(p.nombre)}</span>
          <span class="admin-dash-stock-badge">${p.stock} uds</span>
        </a>
      </li>`).join('');
  }

  function applyDashboard(data) {
    if (!data) return;

    if (updatedAtEl && data.meta?.generatedAt) {
      updatedAtEl.dateTime = data.meta.generatedAt;
      updatedAtEl.textContent = formatDateTime(data.meta.generatedAt);
    }

    document.querySelectorAll('[data-count]').forEach((el) => {
      el.dataset.animated = '';
    });

    const s = data.summary;
    const kpiMap = [
      ['[data-count]', null],
    ];

    const counters = document.querySelectorAll('[data-count]');
    const values = [
      s.ingresosMes, s.pedidosPendientes, s.productosActivos, s.stockBajoCount,
      s.ingresosTotal, s.totalPedidos, s.ticketPromedio, s.categoriasActivas, s.usuariosActivos,
    ];
    counters.forEach((el, i) => {
      if (values[i] == null) return;
      el.dataset.count = String(Math.round(values[i]));
      const prefix = el.dataset.prefix || '';
      el.textContent = prefix + Math.round(values[i]).toLocaleString('es-CO');
    });

    initCounters();
    if (data.ventasPorDia) {
      renderVentasChart(data.ventasPorDia, data.maxVentasDia);
      renderVentasSubtitle(data.meta);
      if (data.meta?.ventasDesde && data.meta?.ventasHasta) {
        ventasRange = {
          desde: data.meta.ventasDesde,
          hasta: data.meta.ventasHasta,
        };
        syncVentasInputs();
      }
    }
    renderEstados(data.pedidosPorEstado, data.maxEstado);
    if (data.pedidosRecientes?.length) renderPedidos(data.pedidosRecientes);
    if (data.topProductos?.length) renderTop(data.topProductos);
    if (data.stockBajo?.length) renderStock(data.stockBajo);
  }

  async function refreshDashboard() {
    if (!refreshUrl || !refreshBtn) return;
    refreshBtn.classList.add('is-loading');
    refreshBtn.disabled = true;

    try {
      const qs = buildQueryString({ desde: ventasRange.desde, hasta: ventasRange.hasta });
      const res = await fetch(`${refreshUrl}${qs}`, {
        headers: { Accept: 'application/json' },
        credentials: 'same-origin',
      });
      if (!res.ok) throw new Error('No se pudo actualizar');
      const json = await res.json();
      if (json.dashboard) applyDashboard(json.dashboard);
    } catch {
      refreshBtn.textContent = 'Error — reintentar';
      setTimeout(() => {
        refreshBtn.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M17.65 6.35A7.96 7.96 0 0 0 12 4a8 8 0 1 0 7.75 10h-2.1A6 6 0 1 1 12 6c1.66 0 3.14.67 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg> Actualizar';
      }, 2000);
    } finally {
      refreshBtn.classList.remove('is-loading');
      refreshBtn.disabled = false;
    }
  }

  initCounters();
  syncVentasInputs();

  ventasFilter?.addEventListener('submit', (e) => {
    e.preventDefault();
    const desde = ventasDesdeInput?.value || '';
    const hasta = ventasHastaInput?.value || '';
    if (!desde || !hasta) {
      setVentasError('Selecciona fecha inicial y final.');
      return;
    }
    if (desde > hasta) {
      setVentasError('La fecha inicial no puede ser posterior a la final.');
      return;
    }
    ventasRange = { desde, hasta };
    loadVentasChart();
  });

  ventasFilter?.querySelectorAll('[data-ventas-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      applyPreset(btn.dataset.ventasPreset);
    });
  });

  refreshBtn?.addEventListener('click', refreshDashboard);

  if (refreshUrl) {
    setInterval(refreshDashboard, 120000);
  }
})();
