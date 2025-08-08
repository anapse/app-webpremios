
import { useState, useEffect } from 'react';

const useFetch = (url) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!url) return;
        setLoading(true);
        setError(null);
        fetch(url)
            .then((res) => {
                if (!res.ok) throw new Error('Error al obtener los datos');
                return res.json();
            })
            .then((data) => setData(data))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, [url]);

    return { data, loading, error };
};

export default useFetch;
