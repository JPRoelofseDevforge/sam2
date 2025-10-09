import axios from 'axios';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

const API_BASE_URL = 'https://jcringapi.azurewebsites.net';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Load token from localStorage on init
let token: string | null = localStorage.getItem('token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// Response interceptor for 401 refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await refreshToken();
        originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
        return api(originalRequest);
      } catch (refreshError) {
        authService.logout();
        return Promise.reject(refreshError);
      }
    } else if (error.response?.status && error.response.status >= 500) {
      return Promise.reject(new ApiError('Server error occurred'));
    }
    return Promise.reject(error);
  }
);

const refreshToken = async (): Promise<void> => {
  try {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) throw new AuthError('No token to refresh');
    const response = await api.get('/userv3/user/refreshUserToken', {
      headers: { Authorization: `Bearer ${currentToken}` }
    });
    const { token: newToken, unionId } = response.data; // Assume response structure
    localStorage.setItem('token', newToken);
    if (unionId) localStorage.setItem('unionId', unionId);
    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
  } catch (error) {
    authService.logout();
    throw new AuthError('Token refresh failed');
  }
};

export const authService = {
  async login(phone: string, password: string): Promise<{ token: string; unionId: string } | null> {
    try {
      const response = await api.post('/userv3/user/login', { phone, userpwd: password });
      const { token, unionId } = response.data; // Assume response has token and unionId
      localStorage.setItem('token', token);
      localStorage.setItem('unionId', unionId);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return { token, unionId };
    } catch (error) {
      authService.logout();
      return null;
    }
  },

  async getUserInfo(): Promise<any[] | null> {
    try {
      const response = await api.get('/userv3/userInfo/queryAll');
      return response.data; // Assume array of users for mapping athlete_id to unionId
    } catch (error) {
      return null;
    }
  },

  async refreshToken(): Promise<void> {
    try {
      const currentToken = localStorage.getItem('token');
      if (!currentToken) throw new AuthError('No token to refresh');
      const response = await api.get('/userv3/user/refreshUserToken', {
        headers: { Authorization: `Bearer ${currentToken}` }
      });
      const { token: newToken, unionId } = response.data; // Assume response structure
      localStorage.setItem('token', newToken);
      if (unionId) localStorage.setItem('unionId', unionId);
      api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
    } catch (error) {
      authService.logout();
      throw new AuthError('Token refresh failed');
    }
  },

  async logout(): Promise<void> {
    localStorage.removeItem('token');
    localStorage.removeItem('unionId');
    delete api.defaults.headers.common['Authorization'];
  },
};

export default authService;

export { api as jcringApi };