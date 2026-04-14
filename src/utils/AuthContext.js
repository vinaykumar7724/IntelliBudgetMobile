import React, { createContext, useState, useContext } from 'react';
import api from './api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const login = async (email, password) => {
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data.success) {
        setUser(res.data);
        return { success: true };
      }
      return { success: false, error: res.data.error };
    } catch (e) {
      return { success: false, error: 'Cannot connect to server' };
    }
  };

  const signup = async (username, email, password) => {
    try {
      const res = await api.post('/api/auth/signup', { username, email, password });
      return res.data;
    } catch (e) {
      return { success: false, error: 'Cannot connect to server' };
    }
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);