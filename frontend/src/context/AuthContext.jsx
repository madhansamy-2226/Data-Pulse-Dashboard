import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user_info');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          localStorage.setItem('user_info', JSON.stringify(userData));
        } catch (err) {
          console.error("Auth initialization failed:", err);
          logout();
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authApi.login(email, password);
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user_info', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    return await authApi.register(userData);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_info');
    setUser(null);
  };

  const isAdmin = user?.role === 'ADMIN';
  const isAnalyst = user?.role === 'ANALYST' || user?.role === 'ADMIN';
  const isViewer = Boolean(user);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAdmin,
        isAnalyst,
        isViewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
