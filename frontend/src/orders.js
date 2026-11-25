// Estados del pedido tal y como se enseñan al usuario
export const STATUS_LABELS = {
  pending: "Pendiente",
  shipped: "Enviado",
  cancelled: "Cancelado",
};

// Frase que acompaña a cada estado en la página de detalle
export const STATUS_NOTES = {
  pending: "Pendiente de envío.",
  shipped: "El pedido ha sido enviado.",
  cancelled: "Pedido cancelado: las unidades han vuelto al stock.",
};

// Un número de pedido corto y legible, a partir de los últimos caracteres del identificador
export function orderNumber(order) {
  return `#${order._id.slice(-6).toUpperCase()}`;
}

export function formatDate(value) {
  return new Date(value).toLocaleString("es-ES");
}
