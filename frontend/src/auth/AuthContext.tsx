import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';

// Performance monitoring utilities
const performanceMonitor = {
  renderCount: 0,
  lastRenderTime: Date.now(),
  authStateChanges: [] as Array<{timestamp: number, action: string, details?: any}>,

  logAuthChange: (action: string, details?: any) => {
    const timestamp = Date.now();
    performanceMonitor.authStateChanges.push({ timestamp, action, details });
    // Removed console.log to prevent excessive output

    // Keep only last 50 entries to prevent memory leaks
    if (performanceMonitor.authStateChanges.length > 50) {
      performanceMonitor.authStateChanges = performanceMonitor.authStateChanges.slice(-50);
    }
  },

  logRender: (component: string) => {
    performanceMonitor.renderCount++;
    const now = Date.now();
    const timeSinceLastRender = now - performanceMonitor.lastRenderTime;
    performanceMonitor.lastRenderTime = now;

    // Temporarily disable rapid re-render logging to reduce console noise
    // if (timeSinceLastRender < 100) { // Log if renders are happening too frequently
    //   console.warn(`⚡ Rapid re-render in ${component}: ${timeSinceLastRender}ms since last render (count: ${performanceMonitor.renderCount})`);
    // }
  },

  getStats: () => ({
    totalRenders: performanceMonitor.renderCount,
    authChanges: performanceMonitor.authStateChanges.length,
    recentChanges: performanceMonitor.authStateChanges.slice(-10)
  })
};

// Make performance monitor available globally for debugging
(window as any).authPerformanceMonitor = performanceMonitor;

interface User {
  user_id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role_name?: string;
  is_admin: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
}

interface StoredAuthData {
  token: string;
  user: User;
  expiresAt: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  performanceMonitor.logRender('AuthProvider');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Wrapped state setters with logging
  const setIsAuthenticatedLogged = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(isAuthenticated) : value;
    if (newValue !== isAuthenticated) {
      performanceMonitor.logAuthChange('setIsAuthenticated', { from: isAuthenticated, to: newValue });
      setIsAuthenticated(newValue);
    }
  }, [isAuthenticated]);

  const setUserLogged = useCallback((value: User | null | ((prev: User | null) => User | null)) => {
    const newValue = typeof value === 'function' ? value(user) : value;
    if (JSON.stringify(newValue) !== JSON.stringify(user)) {
      performanceMonitor.logAuthChange('setUser', { from: user, to: newValue });
      setUser(newValue);
    }
  }, [user]);

  const setTokenLogged = useCallback((value: string | null | ((prev: string | null) => string | null)) => {
    const newValue = typeof value === 'function' ? value(token) : value;
    if (newValue !== token) {
      performanceMonitor.logAuthChange('setToken', { from: token ? token.substring(0, 10) + '...' : null, to: newValue ? newValue.substring(0, 10) + '...' : null });
      setToken(newValue);
    }
  }, [token]);

  const setIsRefreshingLogged = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    const newValue = typeof value === 'function' ? value(isRefreshing) : value;
    if (newValue !== isRefreshing) {
      performanceMonitor.logAuthChange('setIsRefreshing', { from: isRefreshing, to: newValue });
      setIsRefreshing(newValue);
    }
  }, [isRefreshing]);

  // Refs for managing intervals and retries
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const retryDelay = 1000; // 1 second

  // API Base URL configuration
  const getApiBaseUrl = () => {
    // Use the configured JCRing.Api URL for both development and production
    return import.meta.env.VITE_API_URL || 'http://localhost:5288/api';
  };

  const API_BASE_URL = getApiBaseUrl();

  // Robust localStorage operations with error handling
  const safeLocalStorage = {
    getItem: (key: string): string | null => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn(`Failed to read from localStorage for key "${key}":`, error);
        return null;
      }
    },

    setItem: (key: string, value: string): boolean => {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.warn(`Failed to write to localStorage for key "${key}":`, error);
        return false;
      }
    },

    removeItem: (key: string): boolean => {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn(`Failed to remove from localStorage for key "${key}":`, error);
        return false;
      }
    }
  };

  // Validate stored authentication data
  const validateStoredAuthData = (data: any): data is StoredAuthData => {
    return (
      data &&
      typeof data === 'object' &&
      typeof data.token === 'string' &&
      data.token.length > 0 &&
      data.user &&
      typeof data.user === 'object' &&
      typeof data.user.user_id === 'number' &&
      typeof data.user.username === 'string' &&
      typeof data.expiresAt === 'number' &&
      data.expiresAt > Date.now()
    );
  };

  // Clear authentication state
  const clearAuthState = useCallback(() => {
    performanceMonitor.logAuthChange('clearAuthState', { reason: 'manual_clear' });
    setIsAuthenticatedLogged(false);
    setUserLogged(null);
    setTokenLogged(null);
    safeLocalStorage.removeItem('authToken');
    safeLocalStorage.removeItem('user');
    safeLocalStorage.removeItem('authData');

    // Clear any pending intervals
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
  }, []);

  // Store authentication data securely
  const storeAuthData = useCallback((token: string, user: User, expiresIn: number = 3600000) => {
    const expiresAt = Date.now() + expiresIn;
    const authData: StoredAuthData = { token, user, expiresAt };

    const success = safeLocalStorage.setItem('authData', JSON.stringify(authData));
    if (success) {
      // Also store individual items for backward compatibility
      safeLocalStorage.setItem('authToken', token);
      safeLocalStorage.setItem('user', JSON.stringify(user));
    }
    return success;
  }, []);

  // Start monitoring token expiration for automatic refresh
  const startTokenRefreshMonitoring = useCallback((expiresAt: number) => {
    // Clear any existing interval
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }

    // Calculate time until refresh (refresh 5 minutes before expiration)
    const timeUntilRefresh = Math.max(0, expiresAt - Date.now() - 300000);

    performanceMonitor.logAuthChange('startTokenRefreshMonitoring', {
      expiresAt,
      timeUntilRefresh,
      willRefresh: timeUntilRefresh > 0
    });

    if (timeUntilRefresh > 0) {
      refreshIntervalRef.current = setTimeout(async () => {
        performanceMonitor.logAuthChange('tokenRefresh timeout triggered', { tokenExists: !!token, isRefreshing });
        if (token && !isRefreshing) {
          // Call refreshToken directly without dependency to avoid circular reference
          if (isRefreshing) return false;

          performanceMonitor.logAuthChange('refreshToken started from timeout', { token: token.substring(0, 10) + '...' });
          setIsRefreshingLogged(true);
          try {
            const refreshUrl = `${API_BASE_URL}/auth/refresh`;

            const response = await fetch(refreshUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              const data = await response.json();

              // Handle JCRing.Api response format
              if (data && typeof data === 'object' && 'Code' in data && 'Info' in data) {
                if (data.Code === 1 && data.Data?.Token) {
                  const newToken = data.Data.Token;
                  const updatedUser = user || data.Data.User;

                  performanceMonitor.logAuthChange('refreshToken success from timeout', { newToken: newToken.substring(0, 10) + '...', hasUser: !!updatedUser });
                  setTokenLogged(newToken);
                  if (updatedUser) {
                    setUserLogged(updatedUser);
                    storeAuthData(newToken, updatedUser);
                    startTokenRefreshMonitoring(Date.now() + 3600000); // Assume 1 hour expiration
                  }
                  return true;
                }
              } else if (data.token) {
                // Legacy format
                const newToken = data.token;
                const updatedUser = data.user || user;

                performanceMonitor.logAuthChange('refreshToken success from timeout (legacy)', { newToken: newToken.substring(0, 10) + '...', hasUser: !!updatedUser });
                setTokenLogged(newToken);
                if (updatedUser) {
                  setUserLogged(updatedUser);
                  storeAuthData(newToken, updatedUser);
                  // Start token refresh monitoring after successful refresh
                  const newExpiresAt = Date.now() + 3600000;
                  if (refreshIntervalRef.current) {
                    clearInterval(refreshIntervalRef.current);
                    refreshIntervalRef.current = null;
                  }
                  const timeUntilRefresh = Math.max(0, newExpiresAt - Date.now() - 300000);
                  if (timeUntilRefresh > 0) {
                    refreshIntervalRef.current = setTimeout(async () => {
                      if (newToken && !isRefreshing) {
                        await refreshToken(newToken);
                      }
                    }, timeUntilRefresh);
                  }
                }
                return true;
              }
            }
            performanceMonitor.logAuthChange('refreshToken failed from timeout', { status: response.status });
          } catch (error) {
            performanceMonitor.logAuthChange('refreshToken error from timeout', { error: error instanceof Error ? error.message : String(error) });
            console.warn('Token refresh failed:', error);
          } finally {
            setIsRefreshingLogged(false);
          }
        } else if (isRefreshing) {
          performanceMonitor.logAuthChange('tokenRefresh skipped', { reason: 'already_refreshing_in_timeout' });
        }
      }, timeUntilRefresh);
    }
  }, [token, isRefreshing, API_BASE_URL, user, storeAuthData, setIsRefreshingLogged, setTokenLogged, setUserLogged]);

  // Refresh token with retry logic
  const refreshToken = useCallback(async (currentToken: string): Promise<boolean> => {
    if (isRefreshing) {
      performanceMonitor.logAuthChange('refreshToken skipped', { reason: 'already_refreshing' });
      return false;
    }

    performanceMonitor.logAuthChange('refreshToken started', { token: currentToken.substring(0, 10) + '...' });
    setIsRefreshingLogged(true);
    try {
      const refreshUrl = `${API_BASE_URL}/auth/refresh`;

      const response = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Handle JCRing.Api response format
        if (data && typeof data === 'object' && 'Code' in data && 'Info' in data) {
          if (data.Code === 1 && data.Data?.Token) {
            const newToken = data.Data.Token;
            const updatedUser = user || data.Data.User;

            performanceMonitor.logAuthChange('refreshToken success', { newToken: newToken.substring(0, 10) + '...', hasUser: !!updatedUser });
            setTokenLogged(newToken);
            if (updatedUser) {
              setUserLogged(updatedUser);
              storeAuthData(newToken, updatedUser);
              // Start token refresh monitoring after successful refresh
              const newExpiresAt = Date.now() + 3600000;
              if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
              }
              const timeUntilRefresh = Math.max(0, newExpiresAt - Date.now() - 300000);
              if (timeUntilRefresh > 0) {
                refreshIntervalRef.current = setTimeout(async () => {
                  if (newToken && !isRefreshing) {
                    await refreshToken(newToken);
                  }
                }, timeUntilRefresh);
              }
            }
            return true;
          }
        } else if (data.token) {
          // Legacy format
          const newToken = data.token;
          const updatedUser = data.user || user;

          performanceMonitor.logAuthChange('refreshToken success (legacy)', { newToken: newToken.substring(0, 10) + '...', hasUser: !!updatedUser });
          setTokenLogged(newToken);
          if (updatedUser) {
            setUserLogged(updatedUser);
            storeAuthData(newToken, updatedUser);
            startTokenRefreshMonitoring(Date.now() + 3600000);
          }
          return true;
        }
      }
      performanceMonitor.logAuthChange('refreshToken failed', { status: response.status });
    } catch (error) {
      performanceMonitor.logAuthChange('refreshToken error', { error: error instanceof Error ? error.message : String(error) });
      console.warn('Token refresh failed:', error);
    } finally {
      setIsRefreshingLogged(false);
    }
    return false;
  }, [API_BASE_URL, isRefreshing, user, storeAuthData]);

  // Verify token with retry logic
  const verifyTokenWithRetry = useCallback(async (authToken: string, userData: User, attempt: number = 1): Promise<void> => {
    try {
      const verifyUrl = `${API_BASE_URL}/auth/verify`;

      const response = await fetch(verifyUrl, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();

        // Handle JCRing.Api response format
        if (data && typeof data === 'object' && 'Code' in data && 'Info' in data) {
          if (data.Code === 1 && data.Data?.user) {
            performanceMonitor.logAuthChange('verifyTokenWithRetry success', { userId: data.Data.user.user_id });
            setTokenLogged(authToken);
            setUserLogged(data.Data.user);
            setIsAuthenticatedLogged(true);
            storeAuthData(authToken, data.Data.user);
            // Start token refresh monitoring after successful verification
            const newExpiresAt = Date.now() + 3600000;
            if (refreshIntervalRef.current) {
              clearInterval(refreshIntervalRef.current);
              refreshIntervalRef.current = null;
            }
            const timeUntilRefresh = Math.max(0, newExpiresAt - Date.now() - 300000);
            if (timeUntilRefresh > 0) {
              refreshIntervalRef.current = setTimeout(async () => {
                if (authToken && !isRefreshing) {
                  await refreshToken(authToken);
                }
              }, timeUntilRefresh);
            }
            retryCountRef.current = 0; // Reset retry count on success
            return;
          }
        } else {
          // Legacy format
          performanceMonitor.logAuthChange('verifyTokenWithRetry success (legacy)', { userId: (data.user || userData).user_id });
          setTokenLogged(authToken);
          setUserLogged(data.user || userData);
          setIsAuthenticatedLogged(true);
          storeAuthData(authToken, data.user || userData);
          // Start token refresh monitoring after successful verification
          const newExpiresAt = Date.now() + 3600000;
          if (refreshIntervalRef.current) {
            clearInterval(refreshIntervalRef.current);
            refreshIntervalRef.current = null;
          }
          const timeUntilRefresh = Math.max(0, newExpiresAt - Date.now() - 300000);
          if (timeUntilRefresh > 0) {
            refreshIntervalRef.current = setTimeout(async () => {
              if (authToken && !isRefreshing) {
                await refreshToken(authToken);
              }
            }, timeUntilRefresh);
          }
          retryCountRef.current = 0;
          return;
        }
      }

      // If we get here, verification failed
      throw new Error(`Verification failed with status: ${response.status}`);

    } catch (error) {
      console.warn(`Token verification attempt ${attempt} failed:`, error);

      if (attempt < maxRetries) {
        retryCountRef.current = attempt;
        retryTimeoutRef.current = setTimeout(() => {
          verifyTokenWithRetry(authToken, userData, attempt + 1);
        }, retryDelay * attempt); // Exponential backoff
      } else {
        // Max retries reached, clear auth state
        clearAuthState();
        retryCountRef.current = 0;
      }
    }
  }, [API_BASE_URL, maxRetries, retryDelay, storeAuthData, clearAuthState]);

  // Initialize authentication state on app startup
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to load from new format first
        const storedAuthData = safeLocalStorage.getItem('authData');

        if (storedAuthData) {
          try {
            const parsedData = JSON.parse(storedAuthData);
            if (validateStoredAuthData(parsedData)) {
              // Check if token is still valid (with 5-minute buffer)
              if (parsedData.expiresAt > Date.now() + 300000) {
                performanceMonitor.logAuthChange('initializeAuth restored', { userId: parsedData.user.user_id, expiresAt: parsedData.expiresAt });
                setTokenLogged(parsedData.token);
                setUserLogged(parsedData.user);
                setIsAuthenticatedLogged(true);

                // Start token refresh monitoring
                startTokenRefreshMonitoring(parsedData.expiresAt);
                return;
              } else {
                // Token expired, try to refresh
                performanceMonitor.logAuthChange('initializeAuth token_expired', { userId: parsedData.user.user_id });
                await refreshToken(parsedData.token);
                return;
              }
            }
          } catch (error) {
            console.warn('Failed to parse stored auth data:', error);
          }
        }

        // Fallback to old format
        const storedToken = safeLocalStorage.getItem('authToken');
        const storedUser = safeLocalStorage.getItem('user');

        if (storedToken && storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && typeof parsedUser === 'object') {
              // Verify token with backend
              await verifyTokenWithRetry(storedToken, parsedUser);
            }
          } catch (error) {
            console.warn('Failed to parse stored user data:', error);
            clearAuthState();
          }
        }
      } catch (error) {
        console.error('Failed to initialize authentication:', error);
        clearAuthState();
      }
    };

    initializeAuth();
  }, [clearAuthState, storeAuthData, setIsAuthenticatedLogged, setUserLogged, setTokenLogged, refreshToken]);

  // Legacy verifyToken function - kept for backward compatibility but uses new retry logic
  const verifyToken = async (authToken: string) => {
    const storedUser = safeLocalStorage.getItem('user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        await verifyTokenWithRetry(authToken, userData);
      } catch (error) {
        console.warn('Failed to parse stored user for verification:', error);
        clearAuthState();
      }
    } else {
      clearAuthState();
    }
  };

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const loginUrl = `${API_BASE_URL}/auth/login`;

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      // Log response body for debugging 404 errors
      if (!response.ok) {
        try {
          const errorText = await response.text();
          console.error('Login error:', errorText);

          // Suggest alternative endpoint for 404 errors
          if (response.status === 404) {
            const alternativeUrl = API_BASE_URL.includes('/api')
              ? loginUrl.replace('/api/auth/login', '/auth/login')
              : loginUrl.replace('/auth/login', '/api/auth/login');
            console.warn('404 Error - Try alternative endpoint:', alternativeUrl);
          }
        } catch (e) {
          console.error('Could not read error response body:', e);
        }
      }

      if (response.ok) {
        const data = await response.json();

        // Handle JCRing.Api response format
        if (data && typeof data === 'object' && 'Code' in data && 'Info' in data) {
          if (data.Code === 1 && data.Data?.Token) {
            // Transform the API response to match our User interface
            const roles = Array.isArray(data.Data.Roles) ? data.Data.Roles : [];
            const userData: User = {
              user_id: data.Data.UserId,
              username: data.Data.Username,
              email: data.Data.Email,
              first_name: data.Data.Username, // Using username as first name since we don't have separate fields
              last_name: '', // No last name field in response
              role_name: roles[0] || 'user', // Take first role or default to 'user'
              is_admin: roles.includes('admin') || false
            };

            performanceMonitor.logAuthChange('login success', { userId: userData.user_id });
            setTokenLogged(data.Data.Token);
            setUserLogged(userData);
            setIsAuthenticatedLogged(true);

            // Store with expiration (assume 1 hour token validity)
            const success = storeAuthData(data.Data.Token, userData, 3600000);
            if (success) {
              // Start token refresh monitoring after successful login
              const newExpiresAt = Date.now() + 3600000;
              if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
              }
              const timeUntilRefresh = Math.max(0, newExpiresAt - Date.now() - 300000);
              if (timeUntilRefresh > 0) {
                refreshIntervalRef.current = setTimeout(async () => {
                  if (data.Data.Token && !isRefreshing) {
                    await refreshToken(data.Data.Token);
                  }
                }, timeUntilRefresh);
              }
            }
            return true;
          }
        } else {
          // Fallback for legacy response format
          if (data.token && data.user) {
            performanceMonitor.logAuthChange('login success (legacy)', { userId: data.user.user_id });
            setTokenLogged(data.token);
            setUserLogged(data.user);
            setIsAuthenticatedLogged(true);

            const success = storeAuthData(data.token, data.user, 3600000);
            if (success) {
              // Start token refresh monitoring after successful login
              const newExpiresAt = Date.now() + 3600000;
              if (refreshIntervalRef.current) {
                clearInterval(refreshIntervalRef.current);
                refreshIntervalRef.current = null;
              }
              const timeUntilRefresh = Math.max(0, newExpiresAt - Date.now() - 300000);
              if (timeUntilRefresh > 0) {
                refreshIntervalRef.current = setTimeout(async () => {
                  if (data.token && !isRefreshing) {
                    await refreshToken(data.token);
                  }
                }, timeUntilRefresh);
              }
            }
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  }, [API_BASE_URL, storeAuthData, setTokenLogged, setUserLogged, setIsAuthenticatedLogged, isRefreshing, refreshToken]);
  const logout = useCallback(() => {
    clearAuthState();
  }, [clearAuthState]);

  // Cleanup effect for component unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  const isAdmin = useCallback((): boolean => {
    return user?.is_admin || false;
  }, [user?.is_admin]);

  const value = React.useMemo(() => ({
    isAuthenticated,
    user,
    token,
    login,
    logout,
    isAdmin
  }), [isAuthenticated, user, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};