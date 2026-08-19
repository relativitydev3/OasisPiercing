(function () {
  const form = document.querySelector('.auth-form');
  const ccInput = document.getElementById('cc');
  if (!form || !ccInput) return;

  const CC_MAX = 10;
  const CC_REGEX = /^\d{1,10}$/;

  function sanitizeCc(value) {
    return String(value || '').replace(/\D/g, '').slice(0, CC_MAX);
  }

  function getFieldWrap(input) {
    return input.closest('.auth-field');
  }

  function clearClientError(input) {
    const wrap = getFieldWrap(input);
    if (!wrap) return;
    wrap.classList.remove('is-invalid');
    wrap.querySelector('[data-client-error]')?.remove();
  }

  function showClientError(input, message) {
    const wrap = getFieldWrap(input);
    if (!wrap) return;
    wrap.classList.add('is-invalid');
    let el = wrap.querySelector('[data-client-error]');
    if (!el) {
      el = document.createElement('span');
      el.className = 'auth-error';
      el.dataset.clientError = '1';
      el.setAttribute('role', 'alert');
      input.insertAdjacentElement('afterend', el);
    }
    el.textContent = message;
  }

  function validateCc(showError) {
    ccInput.value = sanitizeCc(ccInput.value);
    const value = ccInput.value.trim();

    if (!value) {
      if (showError) showClientError(ccInput, 'La cédula es obligatoria.');
      return false;
    }

    if (!CC_REGEX.test(value)) {
      if (showError) {
        showClientError(ccInput, 'La cédula debe tener solo números (máximo 10 dígitos).');
      }
      return false;
    }

    clearClientError(ccInput);
    return true;
  }

  ccInput.addEventListener('input', () => {
    const clean = sanitizeCc(ccInput.value);
    if (ccInput.value !== clean) ccInput.value = clean;
    if (ccInput.value) validateCc(false);
    else clearClientError(ccInput);
  });

  ccInput.addEventListener('blur', () => {
    validateCc(Boolean(ccInput.value.trim()));
  });

  ccInput.addEventListener('paste', (event) => {
    event.preventDefault();
    const text = event.clipboardData?.getData('text') || '';
    ccInput.value = sanitizeCc(text);
    validateCc(false);
  });

  ccInput.addEventListener('keydown', (event) => {
    const allowed = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
    ];
    if (allowed.includes(event.key)) return;
    if (event.ctrlKey || event.metaKey) return;
    if (!/^\d$/.test(event.key)) event.preventDefault();
  });

  form.addEventListener('submit', (event) => {
    if (!validateCc(true)) {
      event.preventDefault();
      ccInput.focus();
    }
  });

  ccInput.value = sanitizeCc(ccInput.value);
})();
