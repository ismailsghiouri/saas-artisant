import { createContext, createElement, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchMe,
  login as loginRequest,
  loginWithGoogle as loginWithGoogleRequest,
  registerArtisan,
  registerClient,
} from '../utils/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'maalam_expert_token';
const USER_KEY = 'maalam_expert_user';

const readStoredUser = () => {
  const saved = localStorage.getItem(USER_KEY);
  try {
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

/**
 * Fournit la session utilisateur (client ou artisan) à toute l'application.
 *
 * Le user et le token sont d'abord hydratés de façon synchrone depuis
 * localStorage (affichage instantané, pas d'attente réseau), puis revalidés
 * en arrière-plan via GET /api/auth/me : un token expiré ou un compte
 * désactivé entre-temps est ainsi détecté même si le cache local semblait
 * valide.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    fetchMe()
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
    // Volontairement exécuté une seule fois au montage : le token ne change
    // qu'via login/logout, qui gèrent déjà leur propre mise à jour d'état.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applySession = useCallback((res) => {
    localStorage.setItem(TOKEN_KEY, res.token);
    localStorage.setItem(USER_KEY, JSON.stringify(res.user));
    setToken(res.token);
    setUser(res.user);
  }, []);

  const login = useCallback(
    async (email, password) => {
      const res = await loginRequest({ email, password });
      applySession(res);
      return res.user;
    },
    [applySession]
  );

  const loginWithGoogle = useCallback(
    async (accessToken) => {
      const res = await loginWithGoogleRequest(accessToken);
      applySession(res);
      return res.user;
    },
    [applySession]
  );

  const register = useCallback(
    async ({ role: targetRole, ...payload }) => {
      const res =
        targetRole === 'worker' ? await registerArtisan(payload) : await registerClient(payload);
      applySession(res);
      return res.user;
    },
    [applySession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedFields) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...updatedFields };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isWorker = user?.role === 'worker';
  const isClient = user?.role === 'client';

  const value = useMemo(
    () => ({
      user,
      token,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isLoading,
      isWorker,
      isClient,
      login,
      loginWithGoogle,
      register,
      logout,
      updateUser,
    }),
    [user, token, isLoading, isWorker, isClient, login, loginWithGoogle, register, logout, updateUser]
  );

  // createElement plutôt que JSX : ce fichier a l'extension .js, et la config
  // esbuild/Vite du projet ne transpile le JSX que pour les fichiers .jsx.
  return createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
