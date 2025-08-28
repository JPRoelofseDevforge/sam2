import { useState, useEffect, useCallback } from 'react';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '../utils/api';
import { LoadingState } from '../types';

/**
 * Generic hook for API data fetching
 */
export const useApi = <T>(
  endpoint: string,
  params?: Record<string, any>,
  options?: {
    immediate?: boolean;
    cache?: boolean;
    cacheTime?: number;
  }
) => {
  const [state, setState] = useState<LoadingState>({
    isLoading: false,
    error: null,
    data: null,
  });

  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await apiGet<T>(endpoint, params);
      setState({ isLoading: false, error: null, data });
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'An error occurred';
      setState({ isLoading: false, error: errorMessage, data: null });
    }
  }, [endpoint, params]);

  useEffect(() => {
    if (options?.immediate !== false) {
      fetchData();
    }
  }, [fetchData, options?.immediate]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    refetch,
  };
};

/**
 * Hook for CRUD operations
 */
export const useCrud = <T>(resource: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOperation = async <R>(
    operation: () => Promise<R>,
    successMessage?: string
  ): Promise<R | null> => {
    setLoading(true);
    setError(null);

    try {
      const result = await operation();
      if (successMessage) {
        console.log(successMessage);
      }
      return result;
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : 'Operation failed';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getAll = useCallback(async (params?: Record<string, any>) => {
    return handleOperation(() => apiGet<T[]>(`/${resource}`, params));
  }, [resource]);

  const getById = useCallback(async (id: string | number) => {
    return handleOperation(() => apiGet<T>(`/${resource}/${id}`));
  }, [resource]);

  const create = useCallback(async (data: Partial<T>) => {
    return handleOperation(
      () => apiPost<T>(`/${resource}`, data),
      'Item created successfully'
    );
  }, [resource]);

  const update = useCallback(async (id: string | number, data: Partial<T>) => {
    return handleOperation(
      () => apiPut<T>(`/${resource}/${id}`, data),
      'Item updated successfully'
    );
  }, [resource]);

  const remove = useCallback(async (id: string | number) => {
    return handleOperation(
      () => apiDelete<{ message: string }>(`/${resource}/${id}`),
      'Item deleted successfully'
    );
  }, [resource]);

  return {
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    remove,
  };
};

/**
 * Hook for form state management
 */
export const useForm = <T extends Record<string, any>>(
  initialValues: T,
  onSubmit: (values: T) => Promise<void> | void
) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback((name: string, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleBlur = useCallback((name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(values);
      // Reset touched state on successful submit
      setTouched({});
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setIsSubmitting(false);
  }, [initialValues]);

  const setFieldValue = useCallback((name: string, value: any) => {
    handleChange(name, value);
  }, [handleChange]);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const isValid = Object.keys(errors).length === 0 || Object.values(errors).every(error => !error);

  return {
    values,
    errors,
    touched,
    isSubmitting,
    isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    reset,
    setFieldValue,
    setFieldError,
  };
};

/**
 * Hook for local storage with state synchronization
 */
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(() => {
    try {
      localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};

/**
 * Hook for debounced search
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for infinite scroll pagination
 */
export const useInfiniteScroll = (
  fetchMore: (page: number) => Promise<any[]>,
  options?: {
    initialPage?: number;
    pageSize?: number;
  }
) => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(options?.initialPage || 1);
  const [error, setError] = useState<string | null>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    setError(null);

    try {
      const newData = await fetchMore(page);
      if (newData.length === 0 || (options?.pageSize && newData.length < options.pageSize)) {
        setHasMore(false);
      }

      setData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load more data');
    } finally {
      setLoading(false);
    }
  }, [fetchMore, page, loading, hasMore, options?.pageSize]);

  const reset = useCallback(() => {
    setData([]);
    setPage(options?.initialPage || 1);
    setHasMore(true);
    setError(null);
  }, [options?.initialPage]);

  return {
    data,
    loading,
    hasMore,
    error,
    loadMore,
    reset,
  };
};