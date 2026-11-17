// ZAAVO — useAuth Hook

// src/hooks/useAuth.js
// ═══════════════════════════════════════════════════════════

// (Save as separate file: src/hooks/useAuth.js)

import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useCallback }  from 'react';
import toast from 'react-hot-toast';
import {
  loginUser, registerUser, logoutUser,
  clearError, updateUser,
} from '../store';

export function useAuth() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const authState = useSelector(s => s.auth);

  const login = useCallback(async (email, password) => {
    const result = await dispatch(loginUser({ email, password }));
    if (loginUser.fulfilled.match(result)) {
      toast.success('Welcome back! 🎉');
      navigate('/');
      return true;
    } else {
      toast.error(result.payload || 'Login failed');
      return false;
    }
  }, [dispatch, navigate]);

  const register = useCallback(async (userData) => {
    const result = await dispatch(registerUser(userData));
    if (registerUser.fulfilled.match(result)) {
      toast.success('Account created! Verify your email 📧');
      navigate('/profile/verify');
      return true;
    } else {
      toast.error(result.payload || 'Registration failed');
      return false;
    }
  }, [dispatch, navigate]);

  const logout = useCallback(async () => {
    await dispatch(logoutUser());
    toast('Logged out. See you soon! 👋', { icon: '🚪' });
    navigate('/');
  }, [dispatch, navigate]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const isAdmin          = authState.user?.role === 'admin';
  const isRestaurantOwner = authState.user?.role === 'restaurant_owner';
  const isDeliveryPartner = authState.user?.role === 'delivery_partner';
  const isVerified        = authState.user?.isVerified;
  const hasSubscription   = authState.user?.subscription?.isActive;

  return {
    ...authState,
    login,
    register,
    logout,
    clearAuthError,
    isAdmin,
    isRestaurantOwner,
    isDeliveryPartner,
    isVerified,
    hasSubscription,
  };
}
