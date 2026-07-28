const PEDIDO_ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'confirmado', label: 'Confirmado' },
  { value: 'en_preparacion', label: 'En preparación' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'cancelado', label: 'Cancelado' },
];

const PEDIDO_ESTADO_VALUES = PEDIDO_ESTADOS.map((e) => e.value);

function pedidoEstadoLabel(value) {
  return PEDIDO_ESTADOS.find((e) => e.value === value)?.label || value;
}

function isPedidoEditable(estado) {
  return estado !== 'entregado';
}

module.exports = {
  PEDIDO_ESTADOS,
  PEDIDO_ESTADO_VALUES,
  pedidoEstadoLabel,
  isPedidoEditable,
};
