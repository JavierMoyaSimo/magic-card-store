// ¿Puede este usuario ver este pedido? Sí, si es suyo o si es administrador.
// Es una función pura (no toca la base de datos), así se puede probar con tests unitarios.
export function canViewOrder(order, user) {
  if (!order || !user) return false;
  if (user.role === "admin") return true;

  // String() convierte tanto un texto como un ObjectId de MongoDB en texto comparable
  return String(order.user) === String(user.id);
}
