import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/useAuth.js";

function AuthPanel({ onClose }) {
  const { login, register } = useAuth();
  const dialogRef = useRef(null);
  const [mode, setMode] = useState("login"); // "login" o "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const isLogin = mode === "login";

  // Al aparecer, abre el diálogo como ventana modal y pone el cursor en el email
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) return;
    dialog.showModal();
    dialog.querySelector("input")?.focus();
  }, []);

  function closeDialog() {
    dialogRef.current?.close();
  }

  // Un clic sobre el fondo oscuro (fuera del cuadro) cierra la ventana
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) closeDialog();
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setPassword("");
    setError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    try {
      if (isLogin) {
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

  return (
    <dialog
      ref={dialogRef}
      className="auth-dialog"
      aria-labelledby="auth-title"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className="auth-body">
        <div className="auth-header">
          <h2 id="auth-title">Tu cuenta</h2>
          <button
            type="button"
            className="auth-close"
            aria-label="Cerrar"
            onClick={closeDialog}
          >
            ×
          </button>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? "active" : ""}
            aria-pressed={isLogin}
            onClick={() => switchMode("login")}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            className={!isLogin ? "active" : ""}
            aria-pressed={!isLogin}
            onClick={() => switchMode("register")}
          >
            Crear cuenta
          </button>
        </div>

        <p className="hint auth-intro">
          {isLogin
            ? "Inicia sesión para hacer pedidos y consultar tu historial."
            : "Regístrate para hacer pedidos. Es un proyecto de demostración: usa una contraseña que no emplees en otros sitios."}
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
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
              minLength={isLogin ? undefined : 8}
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
            />
            {!isLogin && (
              <span className="field-hint">Mínimo 8 caracteres.</span>
            )}
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "Enviando..." : isLogin ? "Entrar" : "Crear cuenta"}
          </button>
        </form>

        <button
          type="button"
          className="link-button auth-cancel"
          onClick={closeDialog}
        >
          Cancelar
        </button>
      </div>
    </dialog>
  );
}

export default AuthPanel;
