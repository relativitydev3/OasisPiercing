(function () {
  const sidebar = document.getElementById('admin-sidebar');
  const backdrop = document.getElementById('admin-sidebar-backdrop');
  const toggle = document.getElementById('admin-menu-toggle');

  if (!sidebar || !toggle) return;

  function setOpen(open) {
    document.body.classList.toggle('admin-sidebar-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    if (backdrop) backdrop.hidden = !open;
  }

  toggle.addEventListener('click', () => {
    setOpen(!document.body.classList.contains('admin-sidebar-open'));
  });

  if (backdrop) {
    backdrop.addEventListener('click', () => setOpen(false));
  }

  sidebar.querySelectorAll('.admin-sidebar-link').forEach((link) => {
    link.addEventListener('click', () => {
      if (window.matchMedia('(max-width: 960px)').matches) {
        setOpen(false);
      }
    });
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 961px)').matches) {
      setOpen(false);
    }
  });
})();
