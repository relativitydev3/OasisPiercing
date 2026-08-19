(function () {
  const root = document.getElementById('adminDashboard');
  if (!root) return;

  const refreshUrl = root.dataset.refreshUrl;
  const refreshBtn = document.getElementById('dashboardRefreshBtn');
  const updatedAtEl = document.getElementById('dashboardUpdatedAt');

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

  function renderVentasChart(ventasPorDia, maxVentasDia) {
    const chart = document.getElementById('dashboardVentasChart');
    if (!chart) return;

    chart.innerHTML = ventasPorDia.map((d) => {
      const pct = maxVentasDia > 0 ? Math.round((d.total / maxVentasDia) * 100) : 0;
      return `
        <div class="admin-dash-bar-wrap" title="${d.label}: ${formatMoney(d.total)}">
          <div class="admin-dash-bar" style="--h: ${pct}%;"></div>
          <span class="admin-dash-bar-label">${d.label}</span>
          <span class="admin-dash-bar-val">${formatShortMoney(d.total)}</span>
        </div>`;
    }).join('');
  }

  function renderEstados(pedidosPorEstado, maxEstado) {
    const list = document.getElementById('dashboardEstadosList');
    if (!list) return;

    list.innerHTML = pedidosPorEstado.map((e) => {
      const pct = maxEstado > 0 ? Math.round((e.count / maxEstado) * 100) : 0;
      return `
        <li class="admin-dash-estado-item">
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
          <span class="admin-dash-stock-name">${p.nombre}</span>
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
    renderVentasChart(data.ventasPorDia, data.maxVentasDia);
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
      const res = await fetch(refreshUrl, {
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

  refreshBtn?.addEventListener('click', refreshDashboard);

  if (refreshUrl) {
    setInterval(refreshDashboard, 120000);
  }
})();
