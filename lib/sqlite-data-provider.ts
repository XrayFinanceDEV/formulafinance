import { DataProvider } from 'ra-core';

/**
 * SQLite Data Provider for ra-core
 * Communicates with Next.js API routes that interact with SQLite database
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

/**
 * Build query string from params object
 */
function buildQueryString(params: Record<string, any>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        // For nested objects, flatten them
        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
          if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
            query.append(nestedKey, String(nestedValue));
          }
        });
      } else {
        query.append(key, String(value));
      }
    }
  });

  return query.toString();
}

/**
 * HTTP client wrapper
 */
async function httpClient(url: string, options: RequestInit = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || error.message || 'Network error');
  }

  return response.json();
}

/**
 * SQLite Data Provider
 */
export const sqliteDataProvider: DataProvider = {
  /**
   * Get a list of resources
   */
  getList: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
    const { field, order } = params.sort || { field: 'id', order: 'ASC' };
    const { q, ...filters } = params.filter || {};

    const queryParams = buildQueryString({
      page,
      perPage,
      sortField: field,
      sortOrder: order,
      search: q,
      ...filters,
    });

    const url = `${API_BASE_URL}/${resource}?${queryParams}`;
    const response = await httpClient(url);

    return {
      data: response.data || [],
      total: response.total || 0,
    };
  },

  /**
   * Get a single resource by ID
   */
  getOne: async (resource, params) => {
    const url = `${API_BASE_URL}/${resource}/${params.id}`;
    const response = await httpClient(url);

    return {
      data: response.data,
    };
  },

  /**
   * Get many resources by IDs
   */
  getMany: async (resource, params) => {
    // Fetch each resource individually
    const promises = params.ids.map((id) =>
      httpClient(`${API_BASE_URL}/${resource}/${id}`).then((res) => res.data)
    );

    const data = await Promise.all(promises);

    return {
      data,
    };
  },

  /**
   * Get resources by reference
   */
  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 };
    const { field, order } = params.sort || { field: 'id', order: 'ASC' };

    const queryParams = buildQueryString({
      page,
      perPage,
      sortField: field,
      sortOrder: order,
      [params.target]: params.id,
      ...params.filter,
    });

    const url = `${API_BASE_URL}/${resource}?${queryParams}`;
    const response = await httpClient(url);

    return {
      data: response.data || [],
      total: response.total || 0,
    };
  },

  /**
   * Create a new resource
   */
  create: async (resource, params) => {
    const url = `${API_BASE_URL}/${resource}`;
    const response = await httpClient(url, {
      method: 'POST',
      body: JSON.stringify(params.data),
    });

    return {
      data: response.data,
    };
  },

  /**
   * Update a resource
   */
  update: async (resource, params) => {
    const url = `${API_BASE_URL}/${resource}/${params.id}`;
    const response = await httpClient(url, {
      method: 'PUT',
      body: JSON.stringify(params.data),
    });

    return {
      data: response.data,
    };
  },

  /**
   * Update many resources
   */
  updateMany: async (resource, params) => {
    const promises = params.ids.map((id) =>
      httpClient(`${API_BASE_URL}/${resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(params.data),
      })
    );

    await Promise.all(promises);

    return {
      data: params.ids,
    };
  },

  /**
   * Delete a resource
   */
  delete: async (resource, params) => {
    const url = `${API_BASE_URL}/${resource}/${params.id}`;
    const response = await httpClient(url, {
      method: 'DELETE',
    });

    return {
      data: response.data,
    };
  },

  /**
   * Delete many resources
   */
  deleteMany: async (resource, params) => {
    const promises = params.ids.map((id) =>
      httpClient(`${API_BASE_URL}/${resource}/${id}`, {
        method: 'DELETE',
      })
    );

    await Promise.all(promises);

    return {
      data: params.ids,
    };
  },
};

export default sqliteDataProvider;