import { useState, useEffect, useMemo, useCallback } from "react";
import { AuthContext } from "./auth-context";
import { loginUser, registerUser, getCurrentUser } from "../services/api";

const STORAGE_TOKEN_KEY = "ticket_auth_token";
const STORAGE_USER_KEY = "ticket_auth_user";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_TOKEN_KEY) || null;
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_USER_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [authModal, setAuthModal] = useState({
    isOpen: false,
    notice: "",
    defaultTab: "login",
  });

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_TOKEN_KEY);
      localStorage.removeItem(STORAGE_USER_KEY);
    } catch {
      // Ignore storage errors
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await loginUser(email, password);
    setToken(data.token);
    setUser(data.user);
    try {
      localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    } catch {
      // Ignore storage errors in private browsing
    }
    return data;
  }, []);

  const register = useCallback(async (email, password) => {
    await registerUser(email, password);
    return await login(email, password);
  }, [login]);

  // Verify token liveness on app load if token exists
  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    getCurrentUser(token)
      .then((data) => {
        if (isMounted && data?.user) {
          setUser(data.user);
          try {
            localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
          } catch {
            // Ignore
          }
        }
      })
      .catch(() => {
        if (isMounted) {
          logout();
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token, logout]);

  const openAuthModal = useCallback((notice = "", defaultTab = "login") => {
    setAuthModal({
      isOpen: true,
      notice,
      defaultTab,
    });
  }, []);

  const closeAuthModal = useCallback(() => {
    setAuthModal((prev) => ({ ...prev, isOpen: false, notice: "" }));
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      authModal,
      openAuthModal,
      closeAuthModal,
    }),
    [token, user, login, register, logout, authModal, openAuthModal, closeAuthModal]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
