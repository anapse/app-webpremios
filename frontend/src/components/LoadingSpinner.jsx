// src/components/LoadingSpinner.jsx
import React, { useEffect, useRef, useState } from "react";
import spinnerIcon from "../assets/logo128.png";
import "../styles/LoadingSpinner.css";

/**
 * Props:
 *  - active: boolean (control externo)
 *  - text: string
 *  - delayMs: retrasa aparición (anti-parpadeo)
 *  - minVisibleMs: tiempo mínimo visible tras mostrarse
 *  - size: px del logo
 *  - fadeDurationMs: duración de la animación de entrada/salida
 */
export default function LoadingSpinner({
  active = false,
  text = "Cargando...",
  delayMs = 200,
  minVisibleMs = 1700,
  size = 110,
  fadeDurationMs = 350
}) {
  const [visible, setVisible] = useState(false);     // controla clases CSS (fade)
  const [rendered, setRendered] = useState(false);   // mantiene montado el overlay
  const shownAtRef = useRef(0);
  const delayTimer = useRef();
  const hideTimer = useRef();
  const fadeTimer = useRef();

  // Limpieza timers
  useEffect(() => {
    return () => {
      clearTimeout(delayTimer.current);
      clearTimeout(hideTimer.current);
      clearTimeout(fadeTimer.current);
    };
  }, []);

  useEffect(() => {
    clearTimeout(delayTimer.current);
    clearTimeout(hideTimer.current);
    clearTimeout(fadeTimer.current);

    if (active) {
      // Espera delay antes de mostrar (evita parpadeo)
      delayTimer.current = setTimeout(() => {
        setRendered(true);     // monta overlay
        // pequeño tick para que aplique transición
        requestAnimationFrame(() => {
          setVisible(true);    // fade-in
          shownAtRef.current = Date.now();
        });
      }, delayMs);
    } else {
      // Hay que respetar minVisibleMs desde que se mostró
      const elapsed = Date.now() - shownAtRef.current;
      const remaining = Math.max(0, minVisibleMs - elapsed);

      hideTimer.current = setTimeout(() => {
        setVisible(false);     // inicia fade-out
        // después del fade, desmontamos
        fadeTimer.current = setTimeout(() => {
          setRendered(false);
        }, fadeDurationMs);
      }, Math.max(0, remaining));
    }
  }, [active, delayMs, minVisibleMs, fadeDurationMs]);

  if (!rendered) return null;

  return (
    <div
      className={`loading-overlay ${visible ? "is-visible" : "is-hidden"}`}
      style={{ transitionDuration: `${fadeDurationMs}ms` }}
    >
      <div className="loading-content">
        <img
          src={spinnerIcon}
          alt="Cargando"
          className="spinner-img"
          style={{ width: size, height: size }}
          onLoad={() => console.log("✅ Spinner image loaded")}
          onError={() => console.error("❌ Spinner image failed to load")}
        />
        {text && <p className="spinner-text">{text}</p>}
      </div>
    </div>
  );
}
