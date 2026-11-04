import { useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";

const STORAGE_KEY = "magic-store-token";

function readToken() {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

async function authRequest(path, email, password) {
  const response = await fetch(`/api/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "No se pudo completar la operación");
  }
  return data;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readToken);
  const [user, setUser] = useState(null);

  // Al abrir la web (o al cambiar el pase), comprobamos con el servidor que sigue siendo válido
  useEffect(() => {
    if (!token) return;

    let ignore = false;

    async function checkSession() {
      try {
        const response = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (ignore) return;

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else if (response.status === 401) {
          // Pase caducado o inválido: cerramos la sesión
          localStorage.removeItem(STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } catch {
        // Sin conexión con el servidor: mantenemos el pase y reintentamos más tarde
      }
    }

    checkSession();

    return () => {
      ignore = true;
    };
  }, [token]);

  function saveSession(data) {
    localStorage.setItem(STORAGE_KEY, data.token);
    setToken(data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    saveSession(await authRequest("login", email, password));
  }

  async function register(email, password) {
    saveSession(await authRequest("register", email, password));
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    isAdmin: user?.role === "admin",
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
