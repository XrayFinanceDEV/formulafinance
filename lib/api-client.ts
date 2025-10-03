/**
 * API Client
 *
 * Centralized fetch wrapper with error handling and type safety.
 * Replaces the ra-core data provider pattern.
 */

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    message: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export class APIClient {
  private baseURL: string;

  constructor(baseURL: string = '/api') {
    this.baseURL = baseURL;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        error: response.statusText,
      }));
      throw new APIError(
        response.status,
        response.statusText,
        error.error || error.message || 'Request failed'
      );
    }
    return response.json();
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    // Construct the full URL properly
    const fullPath = `${this.baseURL}${endpoint}`;
    const url = new URL(fullPath, window.location.origin);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString());
    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'DELETE',
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new APIClient();
