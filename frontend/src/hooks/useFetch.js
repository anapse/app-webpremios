import { useState, useEffect } from 'react';

const useFetch = (url) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!url) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        const controller = new AbortController();

        fetch(url, {
            signal: controller.signal,
            headers: {
                'Content-Type': 'application/json',
            },
            // Timeout de 10 segundos
        })
            .then((res) => {

                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                }
                return res.json();
            })
            .then((data) => {

                setData(data);
            })
            .catch((err) => {
                if (err.name !== 'AbortError') {
                    console.error('❌ VPS Fetch error:', err.message, 'for', url);
                    setError(`Error conectando al servidor: ${err.message}`);
                }
            })
            .finally(() => setLoading(false));

        return () => controller.abort();
    }, [url]);

    return { data, loading, error };
};

export default useFetch;
