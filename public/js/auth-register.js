(function () {
  const form = document.querySelector('.auth-form, .account-profile-form');
  const ccInput = document.getElementById('cc');
  const telefonoInput = document.getElementById('telefono');
  if (!form || !ccInput || !telefonoInput) return;

  const DIGITS_LEN = 10;
  const DIGITS_10_REGEX = /^\d{10}$/;
  const ERROR_CLASS = form.classList.contains('account-profile-form')
    ? 'account-profile-error'
    : 'auth-error';

  function sanitizeDigits(value) {
    return String(value || '').replace(/\D/g, '').slice(0, DIGITS_LEN);
  }

  function getFieldWrap(input) {
    return input.closest('.auth-field, .account-profile-field');
  }

  function clearClientError(input) {
    const wrap = getFieldWrap(input);
    if (!wrap) return;
    wrap.classList.remove('is-invalid', 'has-error');
    wrap.querySelector('[data-client-error]')?.remove();
  }

  function showClientError(input, message) {
    const wrap = getFieldWrap(input);
    if (!wrap) return;
    wrap.classList.add(wrap.classList.contains('account-profile-field') ? 'has-error' : 'is-invalid');
    let el = wrap.querySelector('[data-client-error]');
    if (!el) {
      el = document.createElement('span');
      el.className = ERROR_CLASS;
      el.dataset.clientError = '1';
      el.setAttribute('role', 'alert');
      input.insertAdjacentElement('afterend', el);
    }
    el.textContent = message;
  }

  function validateDigitsField(input, label, showError) {
    input.value = sanitizeDigits(input.value);
    const value = input.value.trim();

    if (!value) {
      if (showError) showClientError(input, `${label} es obligatorio.`);
      return false;
    }

    if (!DIGITS_10_REGEX.test(value)) {
      if (showError) {
        showClientError(input, `${label} debe contener solo números y tener exactamente 10 dígitos.`);
      }
      return false;
    }

    clearClientError(input);
    return true;
  }

  function bindDigitsInput(input) {
    input.addEventListener('input', () => {
      const clean = sanitizeDigits(input.value);
      if (input.value !== clean) input.value = clean;
      if (input.value) validateDigitsField(input, input.id === 'cc' ? 'La cédula' : 'Teléfono', false);
      else clearClientError(input);
    });

    input.addEventListener('blur', () => {
      if (input.value.trim()) {
        validateDigitsField(input, input.id === 'cc' ? 'La cédula' : 'Teléfono', true);
      }
    });

    input.addEventListener('keydown', (event) => {
      const allowed = [
        'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
        'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End',
      ];
      if (allowed.includes(event.key)) return;
      if (event.ctrlKey || event.metaKey) return;
      if (!/^\d$/.test(event.key)) event.preventDefault();
    });

    input.value = sanitizeDigits(input.value);
  }

  bindDigitsInput(ccInput);
  bindDigitsInput(telefonoInput);

  form.addEventListener('submit', (event) => {
    const ccOk = validateDigitsField(ccInput, 'La cédula', true);
    const telOk = validateDigitsField(telefonoInput, 'Teléfono', true);
    if (!ccOk || !telOk) {
      event.preventDefault();
      if (!telOk) telefonoInput.focus();
      else ccInput.focus();
    }
  });
})();
