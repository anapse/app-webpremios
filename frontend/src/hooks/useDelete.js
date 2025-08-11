// src/hooks/useDelete.js
import { useState } from 'react';

const useDelete = (url) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const deleteData = async () => {
        if (!url) return null;
        setLoading(true);
        setError(null);

        try {
            const res = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!res.ok) {
                throw new Error(`Error ${res.status}: ${res.statusText}`);
            }

            const data = await res.json().catch(() => null); // Por si no hay body
            setLoading(false);
            return data || true; // Si no devuelve JSON, devolvemos true
        } catch (err) {
            setError(err.message || 'Error desconocido');
            setLoading(false);
            return null;
        }
    };

    return { deleteData, loading, error };
};

export default useDelete;
