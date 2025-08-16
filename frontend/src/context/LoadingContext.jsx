// src/context/LoadingContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";

const LoadingCtx = createContext({ show: () => {}, hide: () => {} });

export function LoadingProvider({ children }) {
  const [active, setActive] = useState(false);
  const [text, setText] = useState("Cargando...");

  const api = useMemo(() => ({
    show: (t) => { if (t) setText(t); setActive(true); },
    hide: () => setActive(false),
  }), []);

  // (opcional) bloquear scroll cuando el overlay está activo
  useEffect(() => {
    document.body.classList.toggle("loading", active);
    return () => document.body.classList.remove("loading");
  }, [active]);

  return (
    <LoadingCtx.Provider value={api}>
      {children}
      <LoadingSpinner
        active={active}
        text={text}
        delayMs={0}          // Sin delay para que aparezca inmediatamente
        minVisibleMs={800}   // tiempo mínimo visible reducido
        size={110}           // tamaño base del logo
        fadeDurationMs={250} // duración del fade más rápida
      />
    </LoadingCtx.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingCtx);
}
