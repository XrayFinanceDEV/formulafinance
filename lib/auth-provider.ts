import { AuthProvider } from 'ra-core';

// User roles
export type UserRole = 'admin' | 'manager' | 'user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

// Mock users for development
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@xrayfinance.it',
    role: 'admin',
  },
  {
    id: '2',
    name: 'Manager User',
    email: 'manager@xrayfinance.it',
    role: 'manager',
  },
  {
    id: '3',
    name: 'Regular User',
    email: 'user@xrayfinance.it',
    role: 'user',
  },
];

// Simple in-memory auth state
let currentUser: User | null = null;

export const authProvider: AuthProvider = {
  login: async ({ username, password }) => {
    // Simple mock authentication
    if (password === 'password') {
      const user = mockUsers.find(u => u.email === username) || mockUsers[0];
      currentUser = user;
      localStorage.setItem('auth_user', JSON.stringify(user));
      return Promise.resolve();
    }
    throw new Error('Invalid credentials');
  },

  logout: async () => {
    currentUser = null;
    localStorage.removeItem('auth_user');
    return Promise.resolve();
  },

  checkAuth: async () => {
    if (currentUser) {
      return Promise.resolve();
    }

    // Check localStorage for persisted auth
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      return Promise.resolve();
    }

    throw new Error('Not authenticated');
  },

  checkError: async (error) => {
    if (error.status === 401 || error.status === 403) {
      currentUser = null;
      localStorage.removeItem('auth_user');
      throw new Error('Authentication required');
    }
    return Promise.resolve();
  },

  getIdentity: async () => {
    if (currentUser) {
      return Promise.resolve(currentUser);
    }

    // Check localStorage
    const storedUser = localStorage.getItem('auth_user');
    if (storedUser) {
      currentUser = JSON.parse(storedUser);
      return Promise.resolve(currentUser);
    }

    throw new Error('Not authenticated');
  },

  getPermissions: async () => {
    if (currentUser) {
      return Promise.resolve(currentUser.role);
    }
    throw new Error('Not authenticated');
  },
};

// Permission helpers
export const hasPermission = (requiredRole: UserRole, userRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    user: 1,
    manager: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canEditCustomers = (userRole: UserRole): boolean => {
  return hasPermission('manager', userRole);
};

export const canDeleteCustomers = (userRole: UserRole): boolean => {
  return hasPermission('admin', userRole);
};

export const canViewAnalytics = (userRole: UserRole): boolean => {
  return hasPermission('manager', userRole);
};