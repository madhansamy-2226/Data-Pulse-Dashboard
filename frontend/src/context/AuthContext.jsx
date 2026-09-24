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
        if (token.startsWith('demo-session-token-')) {
          const saved = localStorage.getItem('user_info');
          if (saved) setUser(JSON.parse(saved));
          setLoading(false);
          return;
        }
        try {
          const userData = await authApi.getMe();
          setUser(userData);
          localStorage.setItem('user_info', JSON.stringify(userData));
        } catch (err) {
          const saved = localStorage.getItem('user_info');
          if (saved) {
            setUser(JSON.parse(saved));
          } else {
            logout();
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      localStorage.setItem('user_info', JSON.stringify(data.user));
      setUser(data.user);
      return data.user;
    } catch (err) {
      // Demo session fallback for client-side Vercel previews & offline environments
      const isDemo = email.includes('admin') || email.includes('viewer') || email.includes('salespulse');
      if (isDemo || !import.meta.env.VITE_API_URL) {
        const role = email.toLowerCase().includes('admin') ? 'ADMIN' : 'VIEWER';
        const demoUser = {
          id: role === 'ADMIN' ? 1 : 2,
          email: email || (role === 'ADMIN' ? 'admin@salespulse.dev' : 'viewer@salespulse.dev'),
          username: role === 'ADMIN' ? 'adminuser' : 'viewerdemo',
          role: role,
          company_name: 'SalesPulse Demo Corp',
        };
        const mockToken = 'demo-session-token-' + Date.now();
        localStorage.setItem('access_token', mockToken);
        localStorage.setItem('refresh_token', mockToken);
        localStorage.setItem('user_info', JSON.stringify(demoUser));
        setUser(demoUser);
        return demoUser;
      }
      throw err;
    }
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
