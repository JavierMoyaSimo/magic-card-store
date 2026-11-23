// Quien prefiere menos animaciones recibe un desplazamiento instantáneo
export function scrollBehavior() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "auto"
    : "smooth";
}
