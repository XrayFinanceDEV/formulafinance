import { AuthProvider } from 'ra-core';
import { getSupabaseBrowserClient } from './supabase/client';
import type { User } from '@supabase/supabase-js';

/**
 * Supabase Auth Provider for ra-core
 * Integrates Supabase authentication with react-admin patterns
 */

export const supabaseAuthProvider: AuthProvider = {
  /**
   * Called when the user attempts to log in
   * For OAuth providers, this will redirect to the provider's login page
   */
  login: async ({ username, password, provider }) => {
    const supabase = getSupabaseBrowserClient();

    try {
      // OAuth provider login (Google, GitHub, etc.)
      if (provider) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: provider as any,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });

        if (error) throw error;

        // The redirect happens automatically
        return Promise.resolve();
      }

      // Email/password login
      if (username && password) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: username,
          password: password,
        });

        if (error) throw error;

        // Store user info in localStorage for quick access
        if (data.user) {
          localStorage.setItem('supabase_user', JSON.stringify(data.user));
        }

        return Promise.resolve();
      }

      throw new Error('Missing credentials');
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  },

  /**
   * Called when the user clicks on the logout button
   */
  logout: async () => {
    const supabase = getSupabaseBrowserClient();

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      // Clear local storage
      localStorage.removeItem('supabase_user');

      return Promise.resolve();
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error(error.message || 'Logout failed');
    }
  },

  /**
   * Called when the API returns an error
   */
  checkError: async (error) => {
    const status = error?.status;

    if (status === 401 || status === 403) {
      // Unauthorized - clear session
      localStorage.removeItem('supabase_user');
      return Promise.reject();
    }

    // Other errors are not authentication errors
    return Promise.resolve();
  },

  /**
   * Called when the user navigates to a new location, to check for authentication
   */
  checkAuth: async () => {
    const supabase = getSupabaseBrowserClient();

    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session) {
        throw new Error('No active session');
      }

      // Store user info for quick access
      if (session.user) {
        localStorage.setItem('supabase_user', JSON.stringify(session.user));
      }

      return Promise.resolve();
    } catch (error) {
      localStorage.removeItem('supabase_user');
      return Promise.reject();
    }
  },

  /**
   * Called when the user profile needs to be fetched
   */
  getIdentity: async () => {
    const supabase = getSupabaseBrowserClient();

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (!user) {
        throw new Error('No user found');
      }

      // Map Supabase user to ra-core identity format
      return Promise.resolve({
        id: user.id,
        fullName: user.user_metadata?.full_name || user.email || 'Unknown User',
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        email: user.email,
      });
    } catch (error: any) {
      console.error('Get identity error:', error);
      return Promise.reject(error);
    }
  },

  /**
   * Called to get user permissions (optional)
   * You can implement role-based access control here
   */
  getPermissions: async () => {
    const supabase = getSupabaseBrowserClient();

    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      // You can store roles in user_metadata when users sign up
      // or in a separate database table
      const role = user?.user_metadata?.role || 'user';

      return Promise.resolve(role);
    } catch (error) {
      return Promise.reject(error);
    }
  },
};

export default supabaseAuthProvider;