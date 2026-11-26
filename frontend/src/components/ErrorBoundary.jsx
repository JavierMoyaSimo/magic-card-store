import { Component } from "react";

// Atrapa los errores que ocurren al dibujar sus hijos (por ejemplo, una página diferida que no se descarga)
class ErrorBoundary extends Component {
  state = { hasError: false };

  // React llama a esta función cuando un hijo lanza un error al dibujarse
  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Error al dibujar la página:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="panel">
          <h2>No se pudo cargar esta página</h2>
          <p className="hint">
            Puede ser un problema de conexión o que la web se haya actualizado
            mientras la tenías abierta. Recarga la página para continuar.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Recargar la página
          </button>
        </section>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
