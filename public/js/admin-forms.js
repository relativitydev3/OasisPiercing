(function () {
  document.querySelectorAll('.admin-file-zone').forEach((zone) => {
    const input = zone.querySelector('.admin-file-input');
    const nameEl = zone.querySelector('.admin-file-name');
    if (!input || !nameEl) return;

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      zone.classList.toggle('has-file', Boolean(file));
      nameEl.textContent = file ? `Archivo: ${file.name}` : '';
    });
  });
})();
