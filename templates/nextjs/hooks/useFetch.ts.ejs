'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { request } from '@/lib/api';
import type { AxiosRequestConfig } from 'axios';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Generic data-fetching hook wired to the Spring Boot backend.
 * Automatically re-fetches when `url` changes.
 *
 * @example
 *   const { data, isLoading, error, refetch } = useFetch<UserDto[]>('/api/users');
 */
export function useFetch<T = unknown>(
  url: string | null,
  config?: Omit<AxiosRequestConfig, 'url'>
) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const configRef = useRef(config);
  configRef.current = config;

  const fetchData = useCallback(async () => {
    if (!url) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await request<T>({ url, ...configRef.current });
      setState({ data, isLoading: false, error: null });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'An unexpected error occurred';
      setState({ data: null, isLoading: false, error: message });
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

/**
 * Mutation hook for POST / PUT / DELETE calls.
 *
 * @example
 *   const { mutate, isLoading, error } = useMutation<UserDto>('/api/users/me', 'PUT');
 *   await mutate({ firstName: 'John' });
 */
export function useMutation<T = unknown>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH' = 'POST'
) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    isLoading: false,
    error: null,
  });

  const mutate = useCallback(
    async (body?: unknown): Promise<T | null> => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      try {
        const data = await request<T>({ url, method, data: body });
        setState({ data, isLoading: false, error: null });
        return data;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred';
        setState({ data: null, isLoading: false, error: message });
        return null;
      }
    },
    [url, method]
  );

  return { ...state, mutate };
}
