import { useEffect, useRef, useState } from "react";

/**
 * useFetch(url, { method, headers, body, timeoutMs })
 * Hook optimizado para desarrollo sin errores de AbortError
 */
export default function useFetch(url, options = {}) {
    const {
        method = "GET",
        headers = { "Content-Type": "application/json" },
        body,
        timeoutMs = 10000
    } = options;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const controllerRef = useRef(null);
    const refetchTrigger = useRef(0);

    const refetch = () => {
        refetchTrigger.current++;
        setLoading(true);
        setError(null);
    };

    useEffect(() => {
        if (!url) {
            setLoading(false);
            setData(null);
            setError(null);
            return;
        }

        const controller = new AbortController();
        controllerRef.current = controller;

        const timer = setTimeout(() => controller.abort('timeout'), timeoutMs);

        async function run() {
            try {
                setLoading(true);
                setError(null);

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

                // Solo setear datos si no está abortado
                if (!controller.signal.aborted) {
                    setData(json);
                }
            } catch (e) {
                // Ignorar AbortError (cleanup de React 18)
                if (e?.name === "AbortError") {
                    return;
                }

                // Solo setear error si no está abortado
                if (!controller.signal.aborted) {
                    console.error("❌ Fetch error:", e?.message || e, "→", url);
                    setError(e?.message || "Error de red");
                }
            } finally {
                clearTimeout(timer);
                // Solo setear loading si no está abortado
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        run();

        return () => {
            clearTimeout(timer);
            controller.abort('cleanup');
        };
    }, [url, method, timeoutMs, refetchTrigger.current]);

    return { data, loading, error, refetch };
}
