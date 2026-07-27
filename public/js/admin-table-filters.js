(function () {
  function normalize(text) {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  function initFilterableTable(table) {
    const filterRow = table.querySelector('.admin-table-filters');
    const tbody = table.querySelector('tbody');
    if (!filterRow || !tbody) return;

    const inputs = [...filterRow.querySelectorAll('.admin-table-filter')];
    const dataRows = [...tbody.querySelectorAll('tr:not(.admin-empty-row):not(.admin-table-no-results)')];
    const emptyRow = tbody.querySelector('.admin-empty-row');
    let noResultsRow = tbody.querySelector('.admin-table-no-results');

    if (!noResultsRow && dataRows.length) {
      noResultsRow = document.createElement('tr');
      noResultsRow.className = 'admin-table-no-results';
      noResultsRow.hidden = true;
      const colCount = table.querySelectorAll('thead tr:first-child th').length;
      noResultsRow.innerHTML = `<td colspan="${colCount}"><div class="admin-table-no-results-msg">Ningún registro coincide con los filtros.</div></td>`;
      tbody.appendChild(noResultsRow);
    }

    const wrap = table.closest('.admin-table-wrap');
    const countEl = wrap?.querySelector('[data-filter-count]');
    const clearBtn = wrap?.querySelector('[data-clear-filters]');
    const total = dataRows.length;

    function applyFilters() {
      const terms = inputs.map((input) => normalize(input.value));
      let visible = 0;

      dataRows.forEach((row) => {
        const cells = [...row.children];
        const match = terms.every((term, i) => {
          if (!term) return true;
          const cell = cells[i];
          if (!cell || cell.classList.contains('col-actions')) return true;
          return normalize(cell.textContent).includes(term);
        });

        row.hidden = !match;
        if (match) visible += 1;
      });

      if (noResultsRow) {
        noResultsRow.hidden = visible > 0 || total === 0;
      }

      if (countEl) {
        const hasFilter = terms.some(Boolean);
        if (hasFilter && total > 0) {
          countEl.textContent = `Mostrando ${visible} de ${total}`;
          countEl.hidden = false;
        } else {
          countEl.hidden = true;
        }
      }

      if (clearBtn) {
        clearBtn.hidden = !terms.some(Boolean);
      }
    }

    inputs.forEach((input) => {
      input.addEventListener('input', applyFilters);
    });

    clearBtn?.addEventListener('click', () => {
      inputs.forEach((input) => { input.value = ''; });
      applyFilters();
    });

    applyFilters();
  }

  document.querySelectorAll('.admin-table-filterable').forEach(initFilterableTable);
})();
