import { useEffect } from "react";

const BASE_TITLE = "Magic Card Store";

// Pone el título de la pestaña mientras la página está en pantalla y lo restaura al salir
export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE_TITLE}` : BASE_TITLE;

    return () => {
      document.title = BASE_TITLE;
    };
  }, [title]);
}
