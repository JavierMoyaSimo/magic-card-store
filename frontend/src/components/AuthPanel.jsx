import { useState } from "react";
import { useAuth } from "../auth/useAuth.js";

function AuthPanel({ onClose }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login"); // "login" o "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  function toggleMode() {
    setMode(mode === "login" ? "register" : "login");
    setError(null);
  }

  return (
    <form className="add-form" onSubmit={handleSubmit}>
      <h2>{mode === "login" ? "Iniciar sesión" : "Crear cuenta"}</h2>

      <label>
        Email
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
      </label>

      <label>
        Contraseña
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={mode === "register" ? 8 : undefined}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          required
        />
      </label>

      <button type="submit" disabled={busy}>
        {busy ? "Enviando..." : mode === "login" ? "Entrar" : "Registrarme"}
      </button>

      {error && <p className="error">{error}</p>}

      <div>
        <button type="button" className="link-button" onClick={toggleMode}>
          {mode === "login"
            ? "¿No tienes cuenta? Regístrate"
            : "¿Ya tienes cuenta? Inicia sesión"}
        </button>{" "}
        <button type="button" className="link-button" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default AuthPanel;
