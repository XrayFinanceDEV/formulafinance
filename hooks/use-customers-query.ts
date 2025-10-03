import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';

export interface Customer {
  id: number;
  name: string;
  email: string;
  type: 'Cliente' | 'Rivenditore' | 'Intermediario' | 'Potenziale';
  licenseUsage: number;
  maxLicenses: number;
  status: 'Attivo' | 'Attenzione' | 'Oltre il limite';
  joinDate: string;
}

interface CustomersResponse {
  data: any[];
  total: number;
}

// Transform database record to Customer interface
function transformDbToCustomer(dbRecord: any): Customer {
  return {
    id: dbRecord.id,
    name: dbRecord.ragione_sociale || dbRecord.name || 'Unknown',
    email: dbRecord.email || '',
    type: capitalizeFirstLetter(dbRecord.tipo_utente || dbRecord.type || 'cliente') as Customer['type'],
    licenseUsage: dbRecord.licenseUsage || 0,
    maxLicenses: dbRecord.maxLicenses || 0,
    status: capitalizeFirstLetter(dbRecord.stato || dbRecord.status || 'attivo') as Customer['status'],
    joinDate: dbRecord.created_at || dbRecord.joinDate || new Date().toISOString(),
    // Include all other database fields
    ...dbRecord,
  };
}

function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export interface CustomerFilters {
  q?: string;
  type?: string;
  status?: string;
}

export interface CustomerPagination {
  page: number;
  perPage: number;
}

export interface CustomerSort {
  field: string;
  order: 'ASC' | 'DESC';
}

/**
 * Fetch paginated list of customers
 */
export function useCustomers(
  pagination: CustomerPagination = { page: 1, perPage: 10 },
  sort: CustomerSort = { field: 'id', order: 'ASC' },
  filter: CustomerFilters = {}
) {
  const params = {
    page: pagination.page,
    perPage: pagination.perPage,
    sortField: sort.field,
    sortOrder: sort.order,
    ...filter,
  };

  return useQuery({
    queryKey: queryKeys.customers.list(params),
    queryFn: () => apiClient.get<CustomersResponse>('/customers', params),
    select: (response) => ({
      data: response.data.map(transformDbToCustomer),
      total: response.total,
    }),
  });
}

/**
 * Fetch single customer by ID
 */
export function useCustomer(id: number) {
  return useQuery({
    queryKey: queryKeys.customers.detail(id),
    queryFn: () => apiClient.get<{ data: any }>(`/customers/${id}`),
    select: (response) => transformDbToCustomer(response.data),
    enabled: !!id,
  });
}

/**
 * Create new customer
 */
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Customer, 'id' | 'joinDate'>) =>
      apiClient.post('/customers', data),
    onSuccess: () => {
      // Invalidate all customer lists
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
    },
  });
}

/**
 * Update existing customer
 */
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Customer> }) =>
      apiClient.put(`/customers/${id}`, data),
    onSuccess: (data, variables) => {
      // Invalidate all lists
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      // Invalidate specific detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(variables.id)
      });
    },
  });
}

/**
 * Delete customer
 */
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => apiClient.delete(`/customers/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.customers.lists() });
      queryClient.removeQueries({ queryKey: queryKeys.customers.detail(id) });
    },
  });
}
