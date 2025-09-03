
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import apiClient, { setTokens, clearTokens } from '@/lib/apiClient';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    if (authChecked) {
      return;
    }
    
    try {
      setAuthChecked(true);
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const response = await apiClient.get('/user/get-user');
      
      if (response.data.success) {
        setUser(response.data.data);
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [authChecked]);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const signIn = useCallback(async (username, email, password) => {
    try {
      const response = await apiClient.post('/user/login', {
        username: username || email,
        email: email || username,
        password
      });

      if (response.data.success) {
        const { user: userData } = response.data.data;
        const accessToken = response.data.data?.accessToken;
        const refreshToken = response.data.data?.refreshToken;
        setTokens({ accessToken, refreshToken });
        setUser(userData);
        return { success: true, data: userData };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await apiClient.post('/user/logout');
    } catch (error) {
      // Logout error - continue anyway
    } finally {
      clearTokens();
      setUser(null);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await apiClient.patch('/user/update-account', profileData);
      if (response.data.success) {
        setUser(prev => ({ ...prev, ...response.data.data }));
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to update profile' 
      };
    }
  }, []);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    try {
      const response = await apiClient.post('/user/change-password', {
        oldPassword: currentPassword,
        newPassword
      });
      
      if (response.data.success) {
        return { success: true };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to change password' 
      };
    }
  }, []);

  const forgotPassword = useCallback(async (email) => {
    try {
      const response = await apiClient.post('/user/forgot-password', { email });
      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to send reset email' 
      };
    }
  }, []);

  const resetPassword = useCallback(async (email, code, newPassword) => {
    try {
      const response = await apiClient.post('/user/reset-password', {
        email,
        code,
        newPassword
      });
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.message || 'Failed to reset password' 
      };
    }
  }, []);

  const value = useMemo(() => {
    const isAuth = !!user;
    
    return {
      user,
      isAuthenticated: isAuth,
      loading,
      signIn,
      signOut,
      updateProfile,
      changePassword,
      forgotPassword,
      resetPassword,
      checkAuthStatus
    };
  }, [user, loading, signIn, signOut, updateProfile, changePassword, forgotPassword, resetPassword, checkAuthStatus]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
