(function () {
  'use strict';

  document.querySelectorAll('.admin-caja-tipo-option input').forEach((input) => {
    input.addEventListener('change', () => {
      document.querySelectorAll('.admin-caja-tipo-option').forEach((el) => el.classList.remove('is-selected'));
      input.closest('.admin-caja-tipo-option')?.classList.add('is-selected');
    });
  });
})();
