import { useState } from 'react';

const useFetch = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const request = async (url, method = 'GET', data = null) => {
        setLoading(true);
        setError(null);

        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };

            if (data) {
                options.body = JSON.stringify(data);
            }

            const res = await fetch(url, options);
            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Error desconocido');

            return result;
        } catch (err) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return { request, loading, error };
};

export default useFetch;
