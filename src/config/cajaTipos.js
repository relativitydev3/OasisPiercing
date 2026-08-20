const CAJA_TIPOS = [
  { value: 'gasto', label: 'Gasto', sign: -1, hint: 'Resta del balance (insumos, compras, etc.)' },
  { value: 'ingreso', label: 'Ingreso extra', sign: 1, hint: 'Suma al balance (entrada manual de dinero)' },
];

const CAJA_TIPO_VALUES = CAJA_TIPOS.map((t) => t.value);

function cajaTipoLabel(value) {
  return CAJA_TIPOS.find((t) => t.value === value)?.label || value;
}

module.exports = { CAJA_TIPOS, CAJA_TIPO_VALUES, cajaTipoLabel };
