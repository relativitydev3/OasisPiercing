(function () {
  const DEFAULT_MSG = '¿Estás seguro de que deseas eliminar este registro?';

  const MSG_BY_MODULE = [
    ['/admin/caja/', '¿Eliminar este movimiento de caja?'],
    ['/admin/pedidos/', '¿Eliminar este pedido?'],
    ['/admin/productos/', '¿Eliminar este producto?'],
    ['/admin/categorias/', '¿Eliminar esta categoría?'],
    ['/admin/usuarios/', '¿Eliminar este usuario?'],
  ];

  const modal = document.getElementById('adminDeleteModal');
  const msgEl = document.getElementById('adminDeleteModalMsg');
  const confirmBtn = document.getElementById('adminDeleteModalConfirm');

  let pendingResolve = null;
  let lastFocused = null;

  function messageForForm(form) {
    const custom = form.dataset.confirm;
    if (custom) return custom;

    const action = form.getAttribute('action') || '';
    for (const [prefix, msg] of MSG_BY_MODULE) {
      if (action.includes(prefix) && action.includes('/eliminar')) return msg;
    }
    return DEFAULT_MSG;
  }

  function isDeleteForm(form) {
    const action = form.getAttribute('action') || '';
    return action.includes('/eliminar');
  }

  function openModal(message) {
    if (!modal || !msgEl) {
      return Promise.resolve(window.confirm(message));
    }

    return new Promise((resolve) => {
      pendingResolve = resolve;
      lastFocused = document.activeElement;
      msgEl.textContent = message;
      modal.hidden = false;
      modal.setAttribute('aria-hidden', 'false');
      requestAnimationFrame(() => {
        modal.classList.add('is-open');
        document.body.classList.add('admin-delete-modal-open');
        confirmBtn?.focus();
      });
    });
  }

  function closeModal(confirmed) {
    if (!modal) return;

    modal.classList.remove('is-open');
    document.body.classList.remove('admin-delete-modal-open');
    modal.setAttribute('aria-hidden', 'true');

    window.setTimeout(() => {
      modal.hidden = true;
      if (lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
      lastFocused = null;
    }, 220);

    if (pendingResolve) {
      pendingResolve(confirmed);
      pendingResolve = null;
    }
  }

  function bindModalControls() {
    if (!modal) return;

    modal.querySelectorAll('[data-delete-modal-cancel]').forEach((el) => {
      el.addEventListener('click', () => closeModal(false));
    });

    confirmBtn?.addEventListener('click', () => closeModal(true));

    document.addEventListener('keydown', (event) => {
      if (!modal.classList.contains('is-open')) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeModal(false);
      }
    });
  }

  function bindDeleteForm(form) {
    if (form.dataset.deleteConfirmBound === '1') return;
    form.dataset.deleteConfirmBound = '1';

    form.addEventListener('submit', (event) => {
      if (form.dataset.deleteConfirmed === '1') {
        delete form.dataset.deleteConfirmed;
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      openModal(messageForForm(form)).then((ok) => {
        if (!ok) return;
        form.dataset.deleteConfirmed = '1';
        form.submit();
      });
    });
  }

  function init() {
    bindModalControls();
    document.querySelectorAll('form').forEach((form) => {
      if (isDeleteForm(form)) bindDeleteForm(form);
    });
  }

  window.adminConfirmDelete = openModal;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
