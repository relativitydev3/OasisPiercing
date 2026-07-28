(function () {
  function isImageFile(file) {
    if (file.type && file.type.startsWith('image/')) return true;
    return /\.(jpe?g|png|webp)$/i.test(file.name || '');
  }

  document.querySelectorAll('.admin-file-zone').forEach((zone) => {
    const input = zone.querySelector('.admin-file-input');
    const nameEl = zone.querySelector('.admin-file-name');
    const previewEl = zone.querySelector('.admin-file-preview');
    const wantsPreview = zone.dataset.filePreview === 'image' && previewEl;
    if (!input || !nameEl) return;

    const clearPreview = () => {
      previewEl?.removeAttribute('src');
      zone.classList.remove('has-preview');
    };

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      zone.classList.toggle('has-file', Boolean(file));
      nameEl.textContent = file ? `Archivo: ${file.name}` : '';

      if (!file || !wantsPreview || !isImageFile(file)) {
        clearPreview();
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        previewEl.src = reader.result;
        zone.classList.add('has-preview');
      };
      reader.onerror = () => clearPreview();
      reader.readAsDataURL(file);
    });
  });
})();
