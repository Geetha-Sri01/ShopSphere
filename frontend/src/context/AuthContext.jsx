import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, registerUser } from '../api/api';

const AuthContext = createContext();

const AUTH_USER_KEY = 'shopsphere_user_v1';
const AUTH_TOKEN_KEY = 'shopsphere_token_v1';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(AUTH_USER_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.warn('Failed to parse auth user from storage:', e);
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(AUTH_TOKEN_KEY) || null;
    } catch (e) {
      return null;
    }
  });

  // Keep localStorage synchronized
  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(AUTH_USER_KEY);
      }
    } catch (e) {
      console.warn('Failed to update user in localStorage:', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      } else {
        localStorage.removeItem(AUTH_TOKEN_KEY);
      }
    } catch (e) {
      console.warn('Failed to update token in localStorage:', e);
    }
  }, [token]);

  /**
   * Login with email and password
   */
  const login = async (email, password) => {
    const data = await loginUser({ email, password });
    if (data && data.user) {
      setUser(data.user);
      setToken(data.token || `token_${Date.now()}`);
      return data.user;
    }
    throw new Error(data?.message || 'Login failed.');
  };

  /**
   * Register a new customer
   */
  const signup = async (userData) => {
    const data = await registerUser(userData);
    if (data && data.user) {
      setUser(data.user);
      setToken(data.token || `token_${Date.now()}`);
      return data.user;
    }
    throw new Error(data?.message || 'Registration failed.');
  };

  /**
   * 1-Click Demo Login
   */
  const demoLogin = async (role = 'customer') => {
    if (role === 'admin') {
      return await login('admin@shopsphere.in', 'admin123');
    }
    return await login('aarav@example.in', 'password123');
  };

  /**
   * Logout
   */
  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(AUTH_USER_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
    } catch (e) {
      console.warn('Error clearing localStorage on logout:', e);
    }
  };

  /**
   * Update current user profile details
   */
  const updateProfile = (updates) => {
    setUser(prev => (prev ? { ...prev, ...updates } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        signup,
        demoLogin,
        logout,
        updateProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
