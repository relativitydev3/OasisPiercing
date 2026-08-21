(function () {
  'use strict';

  function readJsonScript(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch {
      return null;
    }
  }

  const catalog = readJsonScript('oasis-catalog-data');
  if (catalog) window.OASIS_CATALOG = catalog;

  const store = readJsonScript('oasis-store-data');
  if (store) window.OASIS_STORE = store;
})();
