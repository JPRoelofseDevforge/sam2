import { ApiResponse, PaginatedResponse } from '../types';

/**
 * Base API configuration
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

/**
 * Default headers for API requests
 */
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

/**
 * Generic API error class
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Handle API response and throw error if needed
 */
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    let errorData;

    try {
      errorData = await response.json();
      if (errorData.error) {
        errorMessage = errorData.error;
      }
    } catch (e) {
      // Ignore JSON parsing errors
    }

    throw new ApiError(errorMessage, response.status, errorData);
  }

  return response.json();
};

/**
 * Generic GET request
 */
export const apiGet = async <T>(endpoint: string, params?: Record<string, any>): Promise<T> => {
  const url = new URL(`${API_BASE_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
  }

  const token = localStorage.getItem('authToken');
  const headers = {
    ...DEFAULT_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(url.toString(), { headers });
  return handleResponse<T>(response);
};

/**
 * Generic POST request
 */
export const apiPost = async <T>(endpoint: string, data?: any): Promise<T> => {
  const token = localStorage.getItem('authToken');
  const headers = {
    ...DEFAULT_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  return handleResponse<T>(response);
};

/**
 * Generic PUT request
 */
export const apiPut = async <T>(endpoint: string, data?: any): Promise<T> => {
  const token = localStorage.getItem('authToken');
  const headers = {
    ...DEFAULT_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PUT',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  return handleResponse<T>(response);
};

/**
 * Generic DELETE request
 */
export const apiDelete = async <T>(endpoint: string): Promise<T> => {
  const token = localStorage.getItem('authToken');
  const headers = {
    ...DEFAULT_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'DELETE',
    headers,
  });

  return handleResponse<T>(response);
};

/**
 * Generic PATCH request
 */
export const apiPatch = async <T>(endpoint: string, data?: any): Promise<T> => {
  const token = localStorage.getItem('authToken');
  const headers = {
    ...DEFAULT_HEADERS,
    ...(token && { Authorization: `Bearer ${token}` }),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'PATCH',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  return handleResponse<T>(response);
};

/**
 * Upload file
 */
export const apiUpload = async <T>(endpoint: string, file: File, fieldName: string = 'file'): Promise<T> => {
  const token = localStorage.getItem('authToken');
  const formData = new FormData();
  formData.append(fieldName, file);

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  return handleResponse<T>(response);
};

/**
 * Generic CRUD operations for a resource
 */
export const createCrudOperations = <T>(resource: string) => ({
  getAll: (params?: Record<string, any>) => apiGet<T[]>(`/${resource}`, params),
  getById: (id: string | number) => apiGet<T>(`/${resource}/${id}`),
  create: (data: Partial<T>) => apiPost<T>(`/${resource}`, data),
  update: (id: string | number, data: Partial<T>) => apiPut<T>(`/${resource}/${id}`, data),
  delete: (id: string | number) => apiDelete<{ message: string }>(`/${resource}/${id}`),
});

/**
 * Retry mechanism for failed requests
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        throw lastError;
      }

      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

/**
 * Cache mechanism for API responses
 */
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

export const withCache = async <T>(
  key: string,
  fn: () => Promise<T>,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): Promise<T> => {
  const cached = cache.get(key);
  const now = Date.now();

  if (cached && (now - cached.timestamp) < cached.ttl) {
    return cached.data;
  }

  const data = await fn();
  cache.set(key, { data, timestamp: now, ttl });

  return data;
};

/**
 * Clear cache for specific key or all cache
 */
export const clearCache = (key?: string) => {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
};