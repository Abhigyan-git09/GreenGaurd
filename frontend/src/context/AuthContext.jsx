import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, check if a token exists and restore the session
  useEffect(() => {
    const token = api.getToken();
    if (token) {
      api.getMe()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          // Token is invalid/expired — clear it
          api.logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await api.login(email, password);
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.message || 'Login failed. Check your credentials.');
      return false;
    }
  };

  const register = async (email, password, fullName, role) => {
    setError(null);
    try {
      const data = await api.register(email, password, fullName, role);
      setUser(data.user);
      return true;
    } catch (err) {
      setError(err.message || 'Registration failed.');
      return false;
    }
  };

  const forgotPassword = async (email) => {
    setError(null);
    try {
      await api.forgotPassword(email);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to request password reset.');
      return false;
    }
  };

  const resetPassword = async (token, newPassword) => {
    setError(null);
    try {
      await api.resetPassword(token, newPassword);
      return true;
    } catch (err) {
      setError(err.message || 'Failed to reset password.');
      return false;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const switchRole = (role) => {
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider value={{ user, error, login, register, forgotPassword, resetPassword, logout, switchRole, setUser, loading, setError }}>
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
