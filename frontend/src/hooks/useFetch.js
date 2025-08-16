import { useEffect, useRef, useState } from "react";
import { useLoading } from "../context/LoadingContext"; // opcional: loader global

/**
 * useFetch(url, { method, headers, body, timeoutMs, useGlobalLoader })
 *
 * - timeoutMs: ms de timeout (default 10000)
 * - useGlobalLoader: si true, usa el overlay global del LoadingContext
 */
export default function useFetch(url, options = {}) {
    const {
        method = "GET",
        headers = { "Content-Type": "application/json" },
        body,
        timeoutMs = 10000,
        useGlobalLoader = false,
    } = options;

    const { show, hide } = useLoading?.() || { show: () => { }, hide: () => { } };

    const [data, setData] = useState(null);
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [error, setError] = useState(null);
    const [timestamp, setTimestamp] = useState(null);

    const prevUrlRef = useRef(null);
    const refetchTrigger = useRef(0); // para forzar refetch
    const lastControllerRef = useRef(null);

    const refetch = () => {
        // fuerza un nuevo fetch incluso si la URL es igual
        refetchTrigger.current++;
        // reset estados
        setStatus("loading");
        setError(null);
    };

    useEffect(() => {
        if (!url) {
            setStatus("idle");
            setData(null);
            setError(null);
            return;
        }

        // si URL es igual y no forzamos, no re-fetch
        if (prevUrlRef.current === url && status === "success") {
            return;
        }
        prevUrlRef.current = url;

        const controller = new AbortController();
        lastControllerRef.current = controller;

        const timer = setTimeout(() => controller.abort(new Error("timeout")), timeoutMs);

        async function run() {
            try {
                setStatus("loading");
                setError(null);
                if (useGlobalLoader) show("Cargando...");

                const res = await fetch(url, {
                    method,
                    headers,
                    body,
                    signal: controller.signal,
                });

                if (!res.ok) {
                    const text = await res.text().catch(() => "");
                    throw new Error(`HTTP ${res.status}: ${res.statusText} ${text || ""}`.trim());
                }

                const json = await res.json();
                setData(json);
                setTimestamp(Date.now());
                setStatus("success");
            } catch (e) {
                if (e?.name === "AbortError") {
                    // abort normal o timeout -> si necesitas diferenciar, mira e.message
                    return;
                }
                console.error("❌ Fetch error:", e?.message || e, "→", url);
                setError(e?.message || "Error de red");
                setStatus("error");
            } finally {
                clearTimeout(timer);
                if (useGlobalLoader) hide();
            }
        }

        run();

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [url, refetchTrigger.current]); // NO metas 'options' si cambian en cada render

    return { data, error, status, loading: status === "loading", timestamp, refetch };
}
