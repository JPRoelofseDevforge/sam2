import { useState, useEffect } from 'react';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5288/api';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export const useAdminApi = <T>(endpoint: string, options?: RequestInit) => {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const defaultHeaders = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Construct full URL with API base
      const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options?.headers
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Handle JCRing.Api response format
        if (data && typeof data === 'object' && 'Code' in data && 'Info' in data) {
          if (data.Code === 1) {
            setState({
              data: data.Data,
              loading: false,
              error: null
            });
          } else {
            setState({
              data: null,
              loading: false,
              error: data.Info || 'API Error'
            });
          }
        } else {
          // Fallback for legacy response format
          setState({
            data,
            loading: false,
            error: null
          });
        }
      } else {
        // Handle non-OK responses
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        // Try to parse as JSON if possible
        try {
          const errorJson = JSON.parse(errorText);
          // Handle JCRing.Api error format
          if (errorJson.Info && errorJson.Code !== 1) {
            errorMessage = errorJson.Info;
          } else if (errorJson.error) {
            errorMessage = errorJson.error;
          }
        } catch (parseError) {
          // If it's not JSON, it might be HTML (like a 404 page)
          if (errorText.startsWith('<!doctype') || errorText.startsWith('<html')) {
            errorMessage = 'API server may not be running. Received HTML instead of JSON.';
          }
        }

        setState({
          data: null,
          loading: false,
          error: errorMessage
        });
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: 'Network error: Unable to connect to the server.'
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return {
    ...state,
    refetch: fetchData
  };
};