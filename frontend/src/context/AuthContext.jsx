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

  const logout = () => {
    api.logout();
    setUser(null);
  };

  const switchRole = (role) => {
    // In the backend-integrated version, switching roles means logging in as a different user
    // For convenience, we simulate this by changing the user object locally
    // In production, this would require re-authentication
    if (user) {
      setUser({ ...user, role });
    }
  };

  return (
    <AuthContext.Provider value={{ user, error, login, logout, switchRole, setUser, loading }}>
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
