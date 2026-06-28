import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_BASE_URL = 'http://localhost:8080/api';

const getDeviceId = () => {
  let deviceId = localStorage.getItem('fintrust_device_id');
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem('fintrust_device_id', deviceId);
  }
  return deviceId;
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load token on startup
  useEffect(() => {
    const storedToken = localStorage.getItem('fintrust_token');
    const storedUser = localStorage.getItem('fintrust_user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const deviceId = getDeviceId();
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, deviceId }),
      });

      const data = await response.json();

      if (response.status === 409) {
        return { success: false, conflict: true, error: data.message };
      }

      if (!response.ok) {
        throw new Error(data.error || 'Authentication failed. Please verify your credentials.');
      }

      localStorage.setItem('fintrust_token', data.token);
      localStorage.setItem('fintrust_user', JSON.stringify({
        username: data.username,
        fullName: data.fullName,
        role: data.role
      }));

      setToken(data.token);
      setUser({
        username: data.username,
        fullName: data.fullName,
        role: data.role
      });

      return { success: true, role: data.role };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const forceLogin = async (username, password) => {
    try {
      const deviceId = getDeviceId();
      const response = await fetch(`${API_BASE_URL}/auth/force-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, deviceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Force login failed.');
      }

      localStorage.setItem('fintrust_token', data.token);
      localStorage.setItem('fintrust_user', JSON.stringify({
        username: data.username,
        fullName: data.fullName,
        role: data.role
      }));

      setToken(data.token);
      setUser({
        username: data.username,
        fullName: data.fullName,
        role: data.role
      });

      return { success: true, role: data.role };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (username, password, fullName, role) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, fullName, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed. Please try again.');
      }

      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const forgotPassword = async (username) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Password reset request failed.');
      }

      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('fintrust_token');
    localStorage.removeItem('fintrust_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    forceLogin,
    signup,
    logout,
    forgotPassword,
    isAuthenticated: !!token,
    isAdmin: user?.role === 'ROLE_ADMIN'
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
