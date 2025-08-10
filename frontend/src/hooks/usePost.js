import { useState } from 'react';

const usePost = (url) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const postData = async (body) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
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
      throw err;
    }
  };

  return { postData, loading, error, data };
};

export default usePost;
