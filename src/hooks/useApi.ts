import { useState, useCallback } from 'react';

export function useApi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  };

  const fetchApi = useCallback(async <T>(
    url: string,
    options?: RequestInit
  ): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const token = getToken();
      if (!token && options?.method === 'POST') {
        console.warn('No token found for POST request to:', url);
      }
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      };

      const res = await fetch(url, {
        ...options,
        headers,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'An error occurred');
      }

      const data = await res.json();
      return data as T;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const get = useCallback(<T>(url: string) => {
    return fetchApi<T>(url, { method: 'GET' });
  }, [fetchApi]);

  const post = useCallback(<T>(url: string, body: unknown) => {
    return fetchApi<T>(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }, [fetchApi]);

  const put = useCallback(<T>(url: string, body: unknown) => {
    return fetchApi<T>(url, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }, [fetchApi]);

  const del = useCallback(<T>(url: string) => {
    return fetchApi<T>(url, { method: 'DELETE' });
  }, [fetchApi]);

  return { isLoading, error, get, post, put, del };
}


