// En desarrollo, VITE_API_URL está vacía y las peticiones usan rutas relativas (/api/...),
// que Vite redirige al backend. En producción contiene la dirección pública del backend.
const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");

export function apiUrl(path) {
  return `${API_URL}${path}`;
}

// Códigos con los que Render responde mientras el servidor gratuito despierta
const RETRY_STATUSES = [502, 503, 504];

// Espera un tiempo, pero se interrumpe si se cancela la petición
function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Cancelado", "AbortError"));
      return;
    }

    const timer = setTimeout(resolve, ms);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(new DOMException("Cancelado", "AbortError"));
      },
      { once: true },
    );
  });
}

// Como fetch, pero reintenta mientras el servidor está despertando.
// Úsalo SOLO con peticiones GET: reintentar un POST podría duplicar, por ejemplo, un pedido.
// Espera 2, 4, 6 y luego 8 segundos entre intentos: en total, algo más de un minuto.
export async function fetchWithRetry(
  path,
  options = {},
  { retries = 9, delay = 2000, onRetry } = {},
) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      const response = await fetch(apiUrl(path), options);
      if (!RETRY_STATUSES.includes(response.status) || attempt >= retries)
        return response;
    } catch (error) {
      // Cancelada a propósito, o sin más intentos: se propaga el error
      if (error.name === "AbortError" || attempt >= retries) throw error;
    }

    onRetry?.(attempt + 1);
    await wait(Math.min(delay * (attempt + 1), 8000), options.signal);
  }
}
