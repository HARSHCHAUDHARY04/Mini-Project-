import { useState, useEffect, useCallback } from "react";
import api, { errorMessage } from "../services/api";

/**
 * Custom hook for data fetching using the configured Axios instance.
 * @param {string} url - The API endpoint to fetch
 * @param {object} options - Fetch options { params, manual }
 * @returns {object} - { data, loading, error, refetch, setData }
 */
export function useFetch(url, options = {}) {
  const { params, manual = false } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(!manual);
  const [error, setError] = useState(null);

  const fetchData = useCallback(
    async (overrideParams) => {
      if (!url) return;
      setLoading(true);
      setError(null);
      try {
        const res = await api.get(url, {
          params: overrideParams || params,
        });
        setData(res.data?.data !== undefined ? res.data.data : res.data);
        return res.data;
      } catch (err) {
        const msg = errorMessage(err);
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [url, JSON.stringify(params)]
  );

  useEffect(() => {
    if (!manual && url) {
      fetchData();
    }
  }, [fetchData, manual, url]);

  return { data, loading, error, refetch: fetchData, setData };
}

export default useFetch;
