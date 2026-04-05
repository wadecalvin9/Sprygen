'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { authApi, usersApi } from '@/lib/api';
import type { UserDto, AuthRequest, RegisterRequest } from '@/lib/types';

interface AuthState {
  user: UserDto | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Hydrate from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as UserDto;
        setState({ user, token, isLoading: false, isAuthenticated: true });
      } catch {
        setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
      }
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = useCallback(async (credentials: AuthRequest) => {
    const response = await authApi.login(credentials);
    const { token, role, ...rest } = response.data;
    const user = { ...rest, roles: role ? [role] : [] };

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    setState({
      user: user as UserDto,
      token,
      isLoading: false,
      isAuthenticated: true,
    });

    return response.data;
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    const response = await authApi.register(data);
    return response.data;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const response = await usersApi.me();
      const user = response.data as UserDto;
      localStorage.setItem('user', JSON.stringify(user));
      setState(prev => ({ ...prev, user }));
    } catch {
      await logout();
    }
  }, [logout]);

  const hasRole = useCallback(
    (role: string) => state.user?.roles.includes(role) ?? false,
    [state.user]
  );

  return {
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    login,
    register,
    logout,
    refreshUser,
    hasRole,
  };
}
