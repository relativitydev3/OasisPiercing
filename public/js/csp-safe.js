/**
 * Utilidades compatibles con CSP estricta (script-src-attr 'none').
 * Sin handlers inline: delegación de eventos y carga diferida de fuentes.
 */
(function () {
  'use strict';

  function handleImgError(img) {
    if (img.dataset.fallbackHandled === '1') return;
    img.dataset.fallbackHandled = '1';
    img.style.display = 'none';

    const mode = img.dataset.imgFallback || 'prod';
    const parent = img.parentElement;
    if (!parent) return;

    switch (mode) {
      case 'hide':
        return;
      case 'logo': {
        const sibling = img.nextElementSibling;
        if (sibling) sibling.style.display = 'inline';
        return;
      }
      case 'cart': {
        const fb = img.getAttribute('data-fallback');
        if (fb) parent.textContent = fb;
        return;
      }
      case 'confirm': {
        parent.classList.add('has-fallback');
        const fb = img.getAttribute('data-fallback');
        if (fb) parent.dataset.fallback = fb;
        return;
      }
      case 'prod':
      default: {
        const sibling = img.nextElementSibling;
        if (sibling?.classList.contains('prod-img-fallback')) {
          sibling.hidden = false;
        }
        parent.classList.add('has-fallback');
      }
    }
  }

  document.addEventListener('error', (event) => {
    if (!(event.target instanceof HTMLImageElement)) return;
    handleImgError(event.target);
  }, true);

  function initReloadButtons() {
    document.querySelectorAll('[data-action="reload"]').forEach((btn) => {
      if (btn.dataset.reloadBound) return;
      btn.dataset.reloadBound = '1';
      btn.addEventListener('click', () => window.location.reload());
    });
  }

  function initAsyncFonts() {
    const link = document.getElementById('fonts-async');
    if (!link || link.dataset.fontsBound) return;
    link.dataset.fontsBound = '1';
    const activate = () => { link.media = 'all'; };
    link.addEventListener('load', activate);
    if (link.sheet) activate();
  }

  function init() {
    initReloadButtons();
    initAsyncFonts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
