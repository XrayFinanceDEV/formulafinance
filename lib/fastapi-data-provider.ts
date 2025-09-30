import simpleRestProvider from 'ra-data-simple-rest';
import { DataProvider } from 'ra-core';

// Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Custom headers and auth token management
const httpClient = (url: string, options: any = {}) => {
  // Get auth token from localStorage
  const token = localStorage.getItem('auth_token');

  // Default headers
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Add authorization header if token exists
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Merge headers
  options.headers = {
    ...defaultHeaders,
    ...options.headers,
  };

  return fetch(url, options)
    .then(response => {
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
        throw new Error('Authentication required');
      }

      // Handle other HTTP errors
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    });
};

// Create the base REST provider
const baseDataProvider = simpleRestProvider(API_BASE_URL, httpClient);

// Custom data provider that adapts FastAPI responses to ra-core format
export const fastApiDataProvider: DataProvider = {
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
    const { field, order } = params.sort || { field: 'id', order: 'ASC' };
    const { q, ...filters } = params.filter || {};

    // Build FastAPI-compatible query parameters
    const query = new URLSearchParams();

    // Pagination
    query.append('skip', String((page - 1) * perPage));
    query.append('limit', String(perPage));

    // Sorting
    if (field) {
      query.append('sort_by', field);
      query.append('sort_order', order.toLowerCase());
    }

    // Search query
    if (q) {
      query.append('search', q);
    }

    // Additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        query.append(key, String(value));
      }
    });

    const url = `${API_BASE_URL}/${resource}?${query.toString()}`;

    try {
      const response = await httpClient(url);
      const data = await response.json();

      // FastAPI typically returns { items: [...], total: number }
      // Adapt to ra-core format
      return {
        data: data.items || data.data || data,
        total: data.total || data.count || (data.items ? data.items.length : data.length),
      };
    } catch (error) {
      console.error('getList error:', error);
      throw error;
    }
  },

  getOne: async (resource, params) => {
    const url = `${API_BASE_URL}/${resource}/${params.id}`;

    try {
      const response = await httpClient(url);
      const data = await response.json();

      return { data };
    } catch (error) {
      console.error('getOne error:', error);
      throw error;
    }
  },

  getMany: async (resource, params) => {
    // FastAPI might not have native getMany, so we'll make individual calls
    // or use a batch endpoint if available
    const promises = params.ids.map(id =>
      httpClient(`${API_BASE_URL}/${resource}/${id}`)
        .then(response => response.json())
    );

    try {
      const data = await Promise.all(promises);
      return { data };
    } catch (error) {
      console.error('getMany error:', error);
      throw error;
    }
  },

  getManyReference: async (resource, params) => {
    // Similar to getList but with a reference filter
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
    const { field, order } = params.sort || { field: 'id', order: 'ASC' };

    const query = new URLSearchParams();
    query.append('skip', String((page - 1) * perPage));
    query.append('limit', String(perPage));
    query.append('sort_by', field);
    query.append('sort_order', order.toLowerCase());
    query.append(params.target, String(params.id));

    const url = `${API_BASE_URL}/${resource}?${query.toString()}`;

    try {
      const response = await httpClient(url);
      const data = await response.json();

      return {
        data: data.items || data.data || data,
        total: data.total || data.count || (data.items ? data.items.length : data.length),
      };
    } catch (error) {
      console.error('getManyReference error:', error);
      throw error;
    }
  },

  create: async (resource, params) => {
    const url = `${API_BASE_URL}/${resource}`;

    try {
      const response = await httpClient(url, {
        method: 'POST',
        body: JSON.stringify(params.data),
      });

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('create error:', error);
      throw error;
    }
  },

  update: async (resource, params) => {
    const url = `${API_BASE_URL}/${resource}/${params.id}`;

    try {
      const response = await httpClient(url, {
        method: 'PUT',
        body: JSON.stringify(params.data),
      });

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('update error:', error);
      throw error;
    }
  },

  updateMany: async (resource, params) => {
    // FastAPI might not have native updateMany, so we'll make individual calls
    const promises = params.ids.map(id =>
      httpClient(`${API_BASE_URL}/${resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(params.data),
      }).then(response => response.json())
    );

    try {
      await Promise.all(promises);
      return { data: params.ids };
    } catch (error) {
      console.error('updateMany error:', error);
      throw error;
    }
  },

  delete: async (resource, params) => {
    const url = `${API_BASE_URL}/${resource}/${params.id}`;

    try {
      const response = await httpClient(url, {
        method: 'DELETE',
      });

      // FastAPI might return the deleted item or just a success message
      let data;
      try {
        data = await response.json();
      } catch {
        // If no JSON response, return the original data
        data = { id: params.id };
      }

      return { data };
    } catch (error) {
      console.error('delete error:', error);
      throw error;
    }
  },

  deleteMany: async (resource, params) => {
    // FastAPI might not have native deleteMany, so we'll make individual calls
    const promises = params.ids.map(id =>
      httpClient(`${API_BASE_URL}/${resource}/${id}`, {
        method: 'DELETE',
      })
    );

    try {
      await Promise.all(promises);
      return { data: params.ids };
    } catch (error) {
      console.error('deleteMany error:', error);
      throw error;
    }
  },
};

// Export both for flexibility
export default fastApiDataProvider;