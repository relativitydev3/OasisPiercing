const { CAJA_TIPO_VALUES } = require('../config/cajaTipos');

function hasValue(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateMovimientoForm(body) {
  const errors = {};

  const tipo = String(body.tipo || '').trim();
  if (!CAJA_TIPO_VALUES.includes(tipo)) {
    errors.tipo = 'Selecciona un tipo válido.';
  }

  if (!hasValue(body.concepto)) {
    errors.concepto = 'El concepto es obligatorio.';
  } else if (body.concepto.trim().length > 200) {
    errors.concepto = 'El concepto es demasiado largo (máx. 200 caracteres).';
  }

  const monto = Number(String(body.monto || '').replace(/\./g, '').replace(',', '.'));
  if (!Number.isFinite(monto) || monto <= 0) {
    errors.monto = 'Indica un monto mayor a cero.';
  } else if (monto > 999999999) {
    errors.monto = 'El monto es demasiado alto.';
  }

  const fecha = String(body.fecha || '').trim();
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    errors.fecha = 'Indica una fecha válida.';
  }

  const notas = body.notas ? String(body.notas).trim() : '';
  if (notas.length > 1000) {
    errors.notas = 'Las notas son demasiado largas (máx. 1000 caracteres).';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    data: {
      tipo,
      concepto: body.concepto?.trim(),
      monto: Math.round(monto),
      fecha,
      notas: notas || null,
    },
  };
}

function parseMesQuery(mesStr) {
  const raw = typeof mesStr === 'string' ? mesStr.trim() : '';
  if (!raw) return null;
  if (/^\d{4}-\d{2}$/.test(raw)) {
    const [, m] = raw.split('-').map(Number);
    if (m >= 1 && m <= 12) return raw;
  }
  return null;
}

function mesToRange(mesKey) {
  const [year, month] = mesKey.split('-').map(Number);
  const desde = `${mesKey}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const hastaExclusive = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { desde, hastaExclusive, year, month };
}

function formatMesLabel(mesKey) {
  const { year, month } = mesToRange(mesKey);
  const d = new Date(year, month - 1, 1);
  return d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

module.exports = {
  validateMovimientoForm,
  parseMesQuery,
  mesToRange,
  formatMesLabel,
};
