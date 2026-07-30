(function () {
  const modal = document.getElementById('admin-pedido-estado-modal');
  if (!modal) return;

  const form = document.getElementById('admin-pedido-estado-form');
  const hiddenEstado = document.getElementById('admin-pedido-estado-value');
  const numeroEl = document.getElementById('admin-pedido-estado-modal-numero');
  const optionsRoot = document.getElementById('admin-pedido-estado-options');

  if (!form || !hiddenEstado || !optionsRoot) return;

  let lastTrigger = null;

  function pickButtons() {
    return [...optionsRoot.querySelectorAll('.admin-pedido-estado-pick')];
  }

  function setSelected(estado) {
    hiddenEstado.value = estado || '';
    pickButtons().forEach((btn) => {
      const active = btn.dataset.estado === estado;
      btn.classList.toggle('is-selected', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function openModal(trigger) {
    const pedidoId = trigger.dataset.pedidoId;
    const numero = trigger.dataset.pedidoNumero || '';
    const estado = trigger.dataset.estado || '';

    if (!pedidoId) return;

    lastTrigger = trigger;
    form.action = `/admin/pedidos/${pedidoId}/estado`;
    if (numeroEl) numeroEl.textContent = numero;
    setSelected(estado);

    modal.removeAttribute('hidden');
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('is-open');
    document.body.classList.add('admin-estado-modal-open');

    const picks = pickButtons();
    (picks.find((b) => b.dataset.estado === estado) || picks[0])?.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('hidden', '');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('admin-estado-modal-open');
    lastTrigger?.focus();
    lastTrigger = null;
  }

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.admin-pedido-estado-trigger');
    if (trigger) {
      event.preventDefault();
      openModal(trigger);
      return;
    }

    const pick = event.target.closest('.admin-pedido-estado-pick');
    if (pick && optionsRoot.contains(pick)) {
      setSelected(pick.dataset.estado);
    }
  });

  modal.querySelectorAll('[data-estado-modal-close]').forEach((el) => {
    el.addEventListener('click', closeModal);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  form.addEventListener('submit', (event) => {
    if (!hiddenEstado.value) {
      event.preventDefault();
      pickButtons()[0]?.focus();
    }
  });
})();
