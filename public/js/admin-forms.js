(function () {
  function isImageFile(file) {
    if (file.type && file.type.startsWith('image/')) return true;
    return /\.(jpe?g|png|webp)$/i.test(file.name || '');
  }

  function clearPreviewLayout(zone, previewEl) {
    previewEl?.removeAttribute('src');
    zone.classList.remove('has-preview', 'is-portrait', 'is-landscape', 'is-square');
    zone.style.removeProperty('--preview-aspect');
  }

  function applyPreviewLayout(zone, previewEl) {
    const width = previewEl.naturalWidth;
    const height = previewEl.naturalHeight;
    if (!width || !height) return;

    const ratio = width / height;
    zone.classList.remove('is-portrait', 'is-landscape', 'is-square');

    if (ratio < 0.9) {
      zone.classList.add('is-portrait');
    } else if (ratio > 1.1) {
      zone.classList.add('is-landscape');
    } else {
      zone.classList.add('is-square');
    }

    zone.style.setProperty('--preview-aspect', `${width} / ${height}`);
    zone.classList.add('has-preview');
  }

  document.querySelectorAll('.admin-file-zone:not([data-file-editor])').forEach((zone) => {
    const input = zone.querySelector('.admin-file-input');
    const nameEl = zone.querySelector('.admin-file-name');
    const previewEl = zone.querySelector('.admin-file-preview');
    const wantsPreview = zone.dataset.filePreview === 'image' && previewEl;
    if (!input || !nameEl) return;

    const clearPreview = () => clearPreviewLayout(zone, previewEl);

    previewEl?.addEventListener('load', () => {
      if (previewEl.src) applyPreviewLayout(zone, previewEl);
    });

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      zone.classList.toggle('has-file', Boolean(file));
      nameEl.textContent = file ? `Archivo: ${file.name}` : '';

      if (!file || !wantsPreview || !isImageFile(file)) {
        clearPreview();
        return;
      }

      clearPreviewLayout(zone, previewEl);

      const reader = new FileReader();
      reader.onload = () => {
        previewEl.src = reader.result;
      };
      reader.onerror = () => clearPreview();
      reader.readAsDataURL(file);
    });
  });
})();
