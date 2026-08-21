/**
 * Trusted Types — debe cargarse antes que cualquier otro script de la app.
 * Con require-trusted-types-for, los sinks DOM (innerHTML, etc.) pasan por estas políticas.
 */
(function () {
  'use strict';

  if (!window.trustedTypes || !window.trustedTypes.createPolicy) return;

  const SCRIPT_TAG = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  const EVENT_HANDLER = /\s(on\w+|style)\s*=\s*(['"])[^'"]*\2/gi;
  const JS_URL = /javascript:/gi;

  function sanitizeHtml(html) {
    return String(html ?? '')
      .replace(SCRIPT_TAG, '')
      .replace(EVENT_HANDLER, '')
      .replace(JS_URL, '');
  }

  function sanitizeScriptUrl(url) {
    const value = String(url ?? '').trim();
    if (value.startsWith('/') || /^https:\/\/cdnjs\.cloudflare\.com\//.test(value)) {
      return value;
    }
    throw new TypeError(`Blocked script URL: ${value}`);
  }

  function sanitizeScript(script) {
    return String(script ?? '');
  }

  const policy = {
    createHTML: sanitizeHtml,
    createScriptURL: sanitizeScriptUrl,
    createScript: sanitizeScript,
  };

  window.trustedTypes.createPolicy('oasis', policy);
  window.trustedTypes.createPolicy('default', policy);
})();
