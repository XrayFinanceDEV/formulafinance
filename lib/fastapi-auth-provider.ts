import { AuthProvider } from 'ra-core';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  avatar_url?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// User roles for permission management
export type UserRole = 'admin' | 'manager' | 'user';

export const fastApiAuthProvider: AuthProvider = {
  login: async ({ username, password }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password,
        }).toString(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Invalid credentials');
      }

      const data: LoginResponse = await response.json();

      // Store token and user info
      localStorage.setItem('auth_token', data.access_token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));

      return Promise.resolve();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const token = localStorage.getItem('auth_token');

      if (token) {
        // Optional: Call logout endpoint to invalidate token on server
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(() => {
          // Ignore logout errors - still clear local storage
        });
      }

      // Clear local storage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      return Promise.resolve();
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local storage even if server call fails
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      return Promise.resolve();
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('auth_token');

    if (!token) {
      throw new Error('No token found');
    }

    try {
      // Verify token with backend
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Token is invalid
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        throw new Error('Token invalid');
      }

      const user = await response.json();

      // Update stored user info
      localStorage.setItem('auth_user', JSON.stringify(user));

      return Promise.resolve();
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      throw error;
    }
  },

  checkError: async (error) => {
    // Handle 401/403 errors
    if (error.status === 401 || error.status === 403) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      throw new Error('Authentication required');
    }

    return Promise.resolve();
  },

  getIdentity: async () => {
    try {
      const storedUser = localStorage.getItem('auth_user');

      if (storedUser) {
        const user = JSON.parse(storedUser);
        return Promise.resolve({
          id: user.id,
          fullName: user.full_name,
          email: user.email,
          avatar: user.avatar_url,
        });
      }

      // If no stored user, try to fetch from API
      const token = localStorage.getItem('auth_token');
      if (token) {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const user = await response.json();
          localStorage.setItem('auth_user', JSON.stringify(user));

          return Promise.resolve({
            id: user.id,
            fullName: user.full_name,
            email: user.email,
            avatar: user.avatar_url,
          });
        }
      }

      throw new Error('No user found');
    } catch (error) {
      console.error('Get identity error:', error);
      throw error;
    }
  },

  getPermissions: async () => {
    try {
      const storedUser = localStorage.getItem('auth_user');

      if (storedUser) {
        const user = JSON.parse(storedUser);
        return Promise.resolve(user.role);
      }

      throw new Error('No user permissions found');
    } catch (error) {
      console.error('Get permissions error:', error);
      throw error;
    }
  },
};

// Permission helpers compatible with FastAPI user roles
export const hasPermission = (requiredRole: UserRole, userRole: string): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    manager: 2,
    admin: 3,
  };

  const userRoleLevel = roleHierarchy[userRole as UserRole] || 0;
  const requiredRoleLevel = roleHierarchy[requiredRole];

  return userRoleLevel >= requiredRoleLevel;
};

export const canEditCustomers = (userRole: string): boolean => {
  return hasPermission('manager', userRole);
};

export const canDeleteCustomers = (userRole: string): boolean => {
  return hasPermission('admin', userRole);
};

export const canViewAnalytics = (userRole: string): boolean => {
  return hasPermission('manager', userRole);
};

export default fastApiAuthProvider;