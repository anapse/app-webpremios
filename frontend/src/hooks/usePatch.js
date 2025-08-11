import { useState } from 'react';

const usePatch = (url) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    // Ahora recibe id y body para formar URL dinámica
    const patchData = async (id, body) => {
        if (!url || !id) {
            setError('URL o ID no proporcionados');
            return null;
        }

        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${url}/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Error en la petición');
            }

            const responseData = await res.json();
            setData(responseData);
            setLoading(false);
            return responseData;
        } catch (err) {
            setError(err.message);
            setLoading(false);
            return null;
        }
    };

    return { patchData, loading, error, data };
};

export default usePatch;
