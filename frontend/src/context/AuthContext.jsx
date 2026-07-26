import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import {
  fetchMe,
  loginArtisan,
  loginClient,
  registerArtisan,
  registerClient,
} from '../utils/api';

export const AuthContext = createContext(null);

const TOKEN_KEY = 'fixnow_token';
const ROLE_KEY = 'fixnow_role';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(() => localStorage.getItem(ROLE_KEY));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const storedRole = localStorage.getItem(ROLE_KEY);

    if (!token || !storedRole) {
      setIsLoading(false);
      return;
    }

    fetchMe(storedRole)
      .then((res) => {
        setUser(res.data);
        setRole(storedRole);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ROLE_KEY);
        setUser(null);
        setRole(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const applySession = useCallback((res, sessionRole) => {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(ROLE_KEY, sessionRole);
    setUser(res.data);
    setRole(sessionRole);
  }, []);

  const login = useCallback(
    async ({ email, password, role: targetRole }) => {
      const res =
        targetRole === 'artisan'
          ? await loginArtisan({ email, password })
          : await loginClient({ email, password });
      applySession(res, targetRole);
      return res.data;
    },
    [applySession]
  );

  const register = useCallback(
    async ({ role: targetRole, ...payload }) => {
      const res =
        targetRole === 'artisan' ? await registerArtisan(payload) : await registerClient(payload);
      applySession(res, targetRole);
      return res.data;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ROLE_KEY);
    setUser(null);
    setRole(null);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : prev));
  }, []);

  const value = useMemo(
    () => ({
      user,
      role,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, role, isLoading, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
