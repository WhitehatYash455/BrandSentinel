import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: UserRole) => Promise<void>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('brand_sentinel_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadUser() {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Failed to load user session', err);
          logout();
        }
      }
      setIsLoading(false);
    }
    loadUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('brand_sentinel_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const register = async (email: string, password: string, fullName: string, role: UserRole) => {
    const res = await api.post('/auth/register', { email, password, fullName, role });
    const { token: newToken, user: newUser } = res.data;
    localStorage.setItem('brand_sentinel_token', newToken);
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('brand_sentinel_token');
    setToken(null);
    setUser(null);
  };

  const switchRole = async (role: UserRole) => {
    try {
      const res = await api.post('/auth/switch-role', { role });
      const { token: newToken, user: newUser } = res.data;
      localStorage.setItem('brand_sentinel_token', newToken);
      setToken(newToken);
      setUser(newUser);
    } catch (err) {
      console.error('Role switch failed:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        switchRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
