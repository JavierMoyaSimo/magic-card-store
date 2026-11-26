// Se muestra mientras el navegador descarga el código de una página diferida
function PageFallback() {
  return (
    <div className="notice-box" role="status">
      <span className="spinner" aria-hidden="true" />
      <p>Cargando página…</p>
    </div>
  );
}

export default PageFallback;
