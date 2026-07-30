(function () {
  const modal = document.getElementById('admin-activo-modal');
  const form = document.getElementById('admin-activo-form');
  const hiddenActivo = document.getElementById('admin-activo-value');
  const labelEl = document.getElementById('admin-activo-modal-label');
  const optionsRoot = document.getElementById('admin-activo-options');
  if (!modal || !form || !hiddenActivo || !optionsRoot) return;

  let lastTrigger = null;
  const pickButtons = () => [...optionsRoot.querySelectorAll('.admin-activo-pick')];

  function setSelected(activo) {
    hiddenActivo.value = activo || '';
    pickButtons().forEach((btn) => {
      const active = btn.dataset.activo === activo;
      btn.classList.toggle('is-selected', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function openModal(trigger) {
    const estadoUrl = trigger.dataset.estadoUrl || '';
    if (!estadoUrl) return;
    lastTrigger = trigger;
    form.action = estadoUrl;
    if (labelEl) labelEl.textContent = trigger.dataset.entityLabel || '';
    setSelected(trigger.dataset.activo || 'false');
    modal.removeAttribute('hidden');
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('admin-estado-modal-open');
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('hidden', '');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('admin-estado-modal-open');
    lastTrigger?.focus();
    lastTrigger = null;
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.admin-activo-trigger');
    if (trigger) { e.preventDefault(); openModal(trigger); return; }
    const pick = e.target.closest('.admin-activo-pick');
    if (pick && optionsRoot.contains(pick)) setSelected(pick.dataset.activo);
  });

  modal.querySelectorAll('[data-activo-modal-close]').forEach((el) => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });
  form.addEventListener('submit', (e) => {
    if (hiddenActivo.value !== 'true' && hiddenActivo.value !== 'false') { e.preventDefault(); pickButtons()[0]?.focus(); }
  });
})();
