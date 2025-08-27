import { useState, useEffect, useCallback, useContext } from 'react';
import { useAuth as useAuthContext } from '../auth/AuthContext';
import { apiPost } from '../utils/api';

/**
 * Enhanced authentication hook with additional utilities
 */
export const useAuthState = () => {
  const auth = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const success = await auth.login(username, password);
      if (!success) {
        setError('Invalid credentials');
      }
      return success;
    } catch (err) {
      setError('Login failed. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [auth]);

  const logout = useCallback(() => {
    auth.logout();
    setError(null);
  }, [auth]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    ...auth,
    login,
    logout,
    isLoading,
    error,
    clearError,
  };
};

/**
 * Hook for checking authentication status
 */
export const useAuthCheck = () => {
  const { isAuthenticated, user } = useAuthContext();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Simulate auth check completion
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  return {
    isAuthenticated,
    user,
    isChecking,
    isReady: !isChecking,
  };
};

/**
 * Hook for protected routes
 */
export const useProtectedRoute = (requireAdmin: boolean = false) => {
  const { isAuthenticated, user, isAdmin } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      setIsLoading(true);

      if (!isAuthenticated) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }

      if (requireAdmin) {
        const adminStatus = await isAdmin();
        setHasAccess(adminStatus);
      } else {
        setHasAccess(true);
      }

      setIsLoading(false);
    };

    checkAccess();
  }, [isAuthenticated, user, requireAdmin, isAdmin]);

  return {
    hasAccess,
    isLoading,
    isAuthenticated,
    user,
  };
};

/**
 * Hook for user permissions
 */
export const usePermissions = () => {
  const { user, isAdmin } = useAuthContext();

  const hasPermission = useCallback((permission: string) => {
    if (!user) return false;

    // Super admin has all permissions
    if (user.role_name === 'SuperAdmin') return true;

    // Define role-based permissions
    const rolePermissions: Record<string, string[]> = {
      OrgAdmin: [
        'manage_athletes',
        'manage_teams',
        'view_reports',
        'manage_users',
      ],
      Coach: [
        'view_athletes',
        'view_reports',
        'manage_training',
      ],
      Analyst: [
        'view_athletes',
        'view_reports',
        'create_reports',
      ],
    };

    const userPermissions = rolePermissions[user.role_name || ''] || [];
    return userPermissions.includes(permission);
  }, [user]);

  const hasAnyPermission = useCallback((permissions: string[]) => {
    return permissions.some(permission => hasPermission(permission));
  }, [hasPermission]);

  const hasAllPermissions = useCallback((permissions: string[]) => {
    return permissions.every(permission => hasPermission(permission));
  }, [hasPermission]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin: isAdmin(),
    user,
  };
};

/**
 * Hook for session management
 */
export const useSession = () => {
  const { user, token } = useAuthContext();
  const [sessionTime, setSessionTime] = useState(0);
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    if (!token) return;

    // Update session time every minute
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 60000);

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    // Warn user when session is about to expire (after 20 minutes)
    if (sessionTime > 20) {
      setIsExpiring(true);
    }
  }, [sessionTime]);

  const extendSession = useCallback(async () => {
    try {
      // Call API to extend session
      await apiPost('/auth/verify');
      setSessionTime(0);
      setIsExpiring(false);
    } catch (error) {
      console.error('Failed to extend session:', error);
    }
  }, []);

  return {
    sessionTime,
    isExpiring,
    extendSession,
    user,
    token,
  };
};