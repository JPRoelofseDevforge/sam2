import { useState, useEffect, useCallback, useContext, useMemo } from 'react';
import { useAuth as useAuthContext } from '../auth/AuthContext';
import { apiPost } from '../utils/api';

// Performance monitoring for hooks
const hookPerformanceMonitor = {
  logHookRender: (hookName: string, dependencies?: any[]) => {
    console.log(`🔄 Hook re-render: ${hookName}`, dependencies ? { deps: dependencies } : {});
  },

  logHookEffect: (hookName: string, effectName: string) => {
    console.log(`⚡ Hook effect: ${hookName}.${effectName}`);
  }
};

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
  hookPerformanceMonitor.logHookRender('useAuthCheck');
  const { isAuthenticated, user } = useAuthContext();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    hookPerformanceMonitor.logHookEffect('useAuthCheck', 'authCheckTimer');
    // Simulate auth check completion
    const timer = setTimeout(() => {
      console.log('🔄 useAuthCheck: Auth check completed');
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
  hookPerformanceMonitor.logHookRender('useProtectedRoute', [requireAdmin]);
  const { isAuthenticated, user, isAdmin } = useAuthContext();
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  // Memoize the admin check to prevent unnecessary re-runs
  const adminCheckResult = useCallback(async () => {
    if (requireAdmin) {
      return await isAdmin();
    }
    return true;
  }, [requireAdmin, isAdmin]);

  useEffect(() => {
    hookPerformanceMonitor.logHookEffect('useProtectedRoute', 'checkAccess');
    let isMounted = true;

    const checkAccess = async () => {
      console.log('🔄 useProtectedRoute: Checking access', { isAuthenticated, requireAdmin, userId: user?.user_id });
      setIsLoading(true);

      if (!isAuthenticated) {
        console.log('🔄 useProtectedRoute: Not authenticated, denying access');
        if (isMounted) {
          setHasAccess(false);
          setIsLoading(false);
        }
        return;
      }

      const accessResult = await adminCheckResult();
      console.log('🔄 useProtectedRoute: Access check result', { accessResult });

      if (isMounted) {
        setHasAccess(accessResult);
        setIsLoading(false);
      }
    };

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [isAuthenticated, adminCheckResult]); // Removed user and isAdmin from dependencies

  return useMemo(() => ({
    hasAccess,
    isLoading,
    isAuthenticated,
    user,
  }), [hasAccess, isLoading, isAuthenticated, user]);
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
  hookPerformanceMonitor.logHookRender('useSession');
  const { user, token } = useAuthContext();
  const [sessionTime, setSessionTime] = useState(0);
  const [isExpiring, setIsExpiring] = useState(false);

  useEffect(() => {
    hookPerformanceMonitor.logHookEffect('useSession', 'sessionTimer');
    if (!token) {
      setSessionTime(0);
      setIsExpiring(false);
      return;
    }

    console.log('🔄 useSession: Starting session timer');
    // Update session time every 5 minutes instead of every minute to reduce re-renders
    const interval = setInterval(() => {
      setSessionTime(prev => {
        const newTime = prev + 5; // Increment by 5 minutes
        console.log('🔄 useSession: Session time updated', { sessionTime: newTime });
        return newTime;
      });
    }, 300000); // 5 minutes instead of 1 minute

    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    hookPerformanceMonitor.logHookEffect('useSession', 'expirationCheck');
    // Warn user when session is about to expire (after 20 minutes)
    const shouldExpire = sessionTime > 20;
    if (shouldExpire !== isExpiring) {
      console.log('🔄 useSession: Session expiring warning', { sessionTime, shouldExpire });
      setIsExpiring(shouldExpire);
    }
  }, [sessionTime, isExpiring]);

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