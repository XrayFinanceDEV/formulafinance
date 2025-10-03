/**
 * Query Key Factory
 *
 * Centralized, type-safe query keys for consistent caching and invalidation.
 *
 * Pattern:
 * - all: Base key for resource
 * - lists(): Keys for list queries
 * - list(filters): Specific list with filters
 * - details(): Keys for detail queries
 * - detail(id): Specific detail query
 */

export const queryKeys = {
  customers: {
    all: ['customers'] as const,
    lists: () => [...queryKeys.customers.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.customers.lists(), filters] as const,
    details: () => [...queryKeys.customers.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.customers.details(), id] as const,
  },

  licenses: {
    all: ['licenses'] as const,
    lists: () => [...queryKeys.licenses.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.licenses.lists(), filters] as const,
    details: () => [...queryKeys.licenses.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.licenses.details(), id] as const,
    byCustomer: (customerId: number | string) =>
      [...queryKeys.licenses.all, 'customer', customerId] as const,
  },

  reports: {
    all: ['reports'] as const,
    lists: () => [...queryKeys.reports.all, 'list'] as const,
    list: (filters?: Record<string, any>) =>
      [...queryKeys.reports.lists(), filters] as const,
    details: () => [...queryKeys.reports.all, 'detail'] as const,
    detail: (id: number | string) =>
      [...queryKeys.reports.details(), id] as const,
  },

  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
  },

  modules: {
    all: ['modules'] as const,
    lists: () => [...queryKeys.modules.all, 'list'] as const,
  },

  associations: {
    all: ['associations'] as const,
    customer: (customerId: number | string) =>
      [...queryKeys.associations.all, 'customer', customerId] as const,
    parent: (customerId: number | string) =>
      [...queryKeys.associations.all, 'parent', customerId] as const,
    search: (customerId: number | string, query: string) =>
      [...queryKeys.associations.all, 'search', customerId, query] as const,
    stats: (userId: number | string) =>
      [...queryKeys.associations.all, 'stats', userId] as const,
  },
} as const;
