// En desarrollo, VITE_API_URL está vacía y las peticiones usan rutas relativas (/api/...),
// que Vite redirige al backend. En producción contiene la dirección pública del backend.
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_URL}${path}`;
}
